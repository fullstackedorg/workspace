import Server, { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../../../main/server/backend";
import { normalizePath } from "../../../main/server/sync/utils";
import fs from "fs";
import path from "path";
import mime from "mime";
import { pathToFileURL } from "url";
import http2 from "http2";
import { SyncService } from "../../../main/server/sync/service";
import Storage from "../../../main/server/sync/storage";
import { StorageErrorType, StorageResponse, SyncDirection } from "../../../main/server/sync/types";
import AdmZip from "adm-zip";

export type App = {
    package: string,
    title?: string,
    icon?: string,
    main?: string
}

export default class extends BackendTool {
    api = {
        async runApp(entrypoint: string) {
            const modulePathURL = pathToFileURL(path.join(SyncService.config.dir, entrypoint))
            const server = (await import(modulePathURL.toString())).default as Server;
            return `http://localhost:${server.port}`;
        },
        listApps() {
            return Object.values(listApps()).flat().map(app => ({
                ...app,
                icon: app.icon ? normalizePath(path.join("app-icon", app.icon)) : undefined
            }))
        },
        async updateApps() {
            SyncService.config.storages.forEach((storage) => {
                if(!storage.keys) 
                    return;
                
                storage.keys.forEach(artifactKey => maybeDecompress(storage, artifactKey))
            });
        },
        async addApp(urlStr: string): Promise<StorageResponse> {
            const url = new URL(urlStr);
            const storage = SyncService.addStorage({ origin: url.origin });

            let response = await storage.hello();
            if (response)
                return response;

            const appKey = url.pathname.slice(1);
            const artefactKey = appKey + "/.build.zip";
            try {
                await storage.client.fs.post().access(artefactKey)
            } catch (e) {
                return {
                    error: StorageErrorType.UNREACHEABLE,
                    message: `Acces not authorized for [${appKey}] from [${origin}]. Response [${e.message}]`
                }
            }

            storage.addKey(artefactKey);
            SyncService.sync(SyncDirection.PULL);
        }
    };
    listeners: (Listener & { prefix?: string; })[] = [{
        name: "App Icon",
        prefix: "/app-icon",
        handler(req, res) {
            const iconPath = SyncService.config.dir + req.url;
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

function listApps() {
    let packagesJSONs: { [origin: string]: App[] } = {};

    SyncService.config.storages.forEach(({ keys, origin }) => {
        if (!keys) return;

        packagesJSONs[origin] = keys
            .map(artifactKey => {
                const appKey = path.dirname(artifactKey);
                return parsePackageJSON(path.join(appKey, "package.json"))
            })
            .filter(Boolean);
    });

    return packagesJSONs;
}

function parsePackageJSON(packageJSONPath: string) {
    let packageJSON;
    try {
        const contents = fs.readFileSync(path.resolve(SyncService.config.dir, packageJSONPath));
        packageJSON = JSON.parse(contents.toString());
    } catch (e) {
        SyncService.status?.sendError(`Failed to parse [${packageJSONPath}]`)
        return null;
    }

    const directory = path.dirname(packageJSONPath);
    const updatePath = (itemPath: string) => normalizePath(path.join(directory, itemPath));

    return {
        package: packageJSONPath,
        title: packageJSON.title || packageJSON.name,
        icon: packageJSON.icon ? updatePath(packageJSON.icon) : undefined,
        main: packageJSON.main ? updatePath(packageJSON.main) : undefined,
    }
}

async function maybeDecompress(storage: Storage, artifactKey: string) {
    if (await storage.hello())
        return null;


    const artifactPathAbsolute = path.resolve(SyncService.config.dir, artifactKey);
    if (!fs.existsSync(artifactPathAbsolute)) {
        SyncService.status.sendError(`Cannot find build artifact [${artifactKey}]`);
        return null;
    }

    storage.client.rsync.baseDir = SyncService.config.dir;

    const appKey = path.dirname(artifactKey);
    const remoteVersion = await getRemoteVersion(storage, appKey);
    const version = storage.client.rsync.getSavedSnapshotAndVersion(appKey)?.version;

    if (!version || version !== remoteVersion) {
        decompress(artifactPathAbsolute, path.resolve(path.join(SyncService.config.dir, appKey)));
        fs.writeFileSync(path.resolve(SyncService.config.dir, appKey, ".fullstacked-sync"), JSON.stringify({ version: remoteVersion }))
    }
}

function getRemoteVersion(storage: Storage, itemPath: string) {
    const session = http2.connect(storage.origin);
    session.on('error', (err) => {
        throw err;
    });

    const stream = session.request({
        ':path': '/version',
        ':method': 'POST',
        ...storage.client.rsync.headers
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

function decompress(archivePath: string, outputPath: string) {
    if (!fs.existsSync(archivePath))
        return;

    const zip = new AdmZip(archivePath);
    zip.extractAllTo(outputPath, true);
}