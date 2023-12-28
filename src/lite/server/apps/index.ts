import Server, { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../../../main/server/backend";
import { Sync } from "../../../main/server/sync/sync";
import { normalizePath } from "../../../main/server/sync/utils";
import fs from "fs";
import path from "path";
import mime from "mime";
import { pathToFileURL } from "url";
import http2 from "http2";
import { SyncClient } from "../../../main/server/sync/client";
import { syncFileName } from "@fullstacked/sync/constants";
import { RsyncHTTP2Client } from "@fullstacked/sync/http2/client";
import createClient from "@fullstacked/webapp/rpc/createClient";
import { scan } from "@fullstacked/sync/utils";

export function listRemoteApps() {
    SyncClient.rsync.baseDir = getLocalBaseDir();
    if (Sync.config.authorization) {
        SyncClient.rsync.headers.authorization = Sync.config.authorization;
        SyncClient.fs.headers.authorization = Sync.config.authorization;
    }

    const session = http2.connect(SyncClient.rsync.endpoint);
    session.on('error', (err) => {
        throw err;
    });

    const stream = session.request({
        ':path': '/packages',
        ':method': 'GET',
        ...SyncClient.rsync.headers
    });
    stream.end();

    stream.setEncoding('utf8')
    return new Promise<[string, number][]>(resolve => {
        let data = '';
        stream.on('data', (chunk) => { data += chunk })
        stream.on('end', () => {
            resolve(JSON.parse(data));
        });
    });
}

function getRemoteVersion(itemPath: string, endpoint: string) {
    SyncClient.rsync.baseDir = getLocalBaseDir();
    if (Sync.config.authorization) {
        SyncClient.rsync.headers.authorization = Sync.config.authorization;
        SyncClient.fs.headers.authorization = Sync.config.authorization;
    }

    const session = http2.connect(endpoint);
    session.on('error', (err) => {
        throw err;
    });

    const stream = session.request({
        ':path': '/version',
        ':method': 'POST',
        ...SyncClient.rsync.headers
    });
    stream.write(itemPath);
    stream.end();

    stream.setEncoding('utf8');
    return new Promise<number>(resolve => {
        let data = '';
        stream.on('data', (chunk) => { data += chunk })
        stream.on('end', () => {
            resolve(JSON.parse(data).version);
        });
    });
}

export default class extends BackendTool {
    api = {
        async runApp(entrypoint: string) {
            const server = (await import(pathToFileURL(path.join(Sync.config.directory, entrypoint)).toString())).default as Server;
            return `http://localhost:${server.port}`;
        },
        async listApps() {
            return scan(SyncClient.rsync.baseDir, ".", [])
                .filter(([packageJSONPath, version]) => packageJSONPath.endsWith("/package.json"))
                .map(([packageJSONPath, version]) => {
                    const packageJSON = JSON.parse(fs.readFileSync(path.resolve(SyncClient.rsync.baseDir, packageJSONPath)).toString());
                    const directory = path.dirname(packageJSONPath);

                    return {
                        title: packageJSON.title || packageJSON.name,

                        icon: packageJSON.icon
                            // the /app-icon handler is used here
                            ? "/" + normalizePath(path.join("app-icon", directory, packageJSON.icon))
                            : undefined,

                        entrypoint: packageJSON.main
                            ? normalizePath(path.join(directory, packageJSON.main))
                            : undefined
                    }
                })
        },
        async updateApps() {
            const packages = await listRemoteApps();
            return (await Promise.all(packages.map(getAppInfosAndMaybePull))).filter(Boolean);
        },
        async addApp(urlStr: string) {
            const url = new URL(urlStr);

            let response;
            response = await hello(url.origin);
            if (response)
                return response;

            return getAppInfosAndMaybePull([url.pathname.slice(1), null], url.origin);
        }
    };
    listeners: (Listener & { prefix?: string; })[] = [{
        name: "App Icon",
        prefix: "/app-icon",
        handler(req, res) {
            const iconPath = Sync.config.directory + req.url;
            if (!fs.existsSync(iconPath)) {
                res.writeHead(404);
                res.end();
                return;
            }

            res.writeHead(200, {
                "content-type": mime.getType(iconPath),
                "content-length": fs.statSync(iconPath).size
            })

            const readStream = fs.createReadStream(iconPath);
            readStream.pipe(res);
        }
    }];
    websocket: WebSocketRegisterer;
}

async function getAppInfosAndMaybePull([packagePath, remoteVersion], endpoint?: string | number) {
    const fsClient = typeof endpoint === "string"
        ? createClient<typeof fs.promises>(endpoint)
        : SyncClient.fs;

    let packageJSONData;
    try {
        packageJSONData = (await fsClient.post().readFile(packagePath)).toString();
    } catch (e) {
        console.log(`Failed to get package.json content [${packagePath}]`);
        return null;
    }

    let packageJSON;
    try {
        packageJSON = JSON.parse(packageJSONData);
    } catch (e) {
        console.log(`Failed to parse package.json [${packagePath}]`)
        return null;
    }

    const files = packageJSON.files;
    if (!files)
        return null;

    if (remoteVersion === null && typeof endpoint === "string")
        remoteVersion = await getRemoteVersion(packagePath, endpoint);

    const rsyncClient = typeof endpoint === "string"
        ? new RsyncHTTP2Client(endpoint)
        : SyncClient.rsync;

    rsyncClient.baseDir = SyncClient.rsync.baseDir;

    fs.mkdirSync(path.resolve(rsyncClient.baseDir, path.dirname(packagePath)), { recursive: true });
    fs.writeFileSync(path.resolve(rsyncClient.baseDir, packagePath), JSON.stringify({
        title: packageJSON.title || packageJSON.name,
        files: packageJSON.files,
        icon: packageJSON.icon,
        main: packageJSON.main
    }, null, 2))

    const pathComponents = packagePath.split("/").slice(0, -1);
    const directory = pathComponents.join("/");
    let version = null;
    while (pathComponents.length && !version) {
        version = rsyncClient.getSavedSnapshotAndVersion(directory)?.version;
        pathComponents.pop();
    }

    if (packageJSON.icon) {
        fs.mkdirSync(path.resolve(rsyncClient.baseDir, directory, path.dirname(packageJSON.icon)), { recursive: true });
        files.push(packageJSON.icon);
    }

    const title = packageJSON.title || packageJSON.name;

    if (version !== remoteVersion) {
        const toSync = files.map(item => normalizePath(path.join(directory, item)));

        Sync.addSyncingKey(title, "pull");
        await Promise.all(toSync.map(item => rsyncClient.pull(item, {
            force: true,
            progress(info) {
                Sync.updateSyncingKeyProgress(title, info)
            }
        })));
        fs.writeFileSync(path.resolve(rsyncClient.baseDir, directory, syncFileName), JSON.stringify({ version: remoteVersion }));
        Sync.removeSyncingKey(title);
    }
}