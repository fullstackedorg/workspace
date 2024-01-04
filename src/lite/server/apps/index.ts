import Server, { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../../../main/server/backend";
import { normalizePath } from "../../../main/server/sync/utils";
import fs from "fs";
import path from "path";
import mime from "mime";
import { pathToFileURL } from "url";
import http2 from "http2";
import { syncFileName } from "@fullstacked/sync/constants";
import { SyncService } from "../../../main/server/sync/service";
import { getStorageByOrigin } from "../../../main/server/sync";
import Storage from "../../../main/server/sync/storage";
import { StorageResponse, SyncDirection } from "../../../main/server/sync/types";

export type App = {
    package: string,
    title?: string,
    icon?: string,
    main?: string,
    files?: string[]
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
            const apps = listApps();
            const origins = Object.keys(apps);
            const updatePromises = origins.map(origin => {
                const storage = getStorageByOrigin(origin, false);
                if (!storage)
                    return [];

                return apps[origin].map((app => maybePull(storage, app)))
            });

            Promise.all(updatePromises.flat());
        },
        async addApp(urlStr: string): Promise<StorageResponse> {
            const url = new URL(urlStr);
            const storage = SyncService.addStorage({ origin: url.origin });

            const helloResponse = await storage.hello();
            if (helloResponse)
                return helloResponse;

            const packagePath = url.pathname.slice(1);
            return maybePull(storage, { package: packagePath });
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
    const packages: { [origin: string]: App[] } = {};
    SyncService.config?.storages?.forEach(({ origin, keys }) => {
        if (!keys)
            return;

        packages[origin] = keys
            .filter(itemKey => itemKey.endsWith("/package.json"))
            .map(parsePackageJSON);
    });

    return packages;
}

function parsePackageJSON(packageJSONPath: string) {
    let packageJSON: any;
    try {
        const contents = fs.readFileSync(path.resolve(SyncService.config.dir, packageJSONPath));
        packageJSON = JSON.parse(contents.toString());
    } catch (e) {
        SyncService.status?.sendError(`Failed to parse [${packageJSONPath}]`)
        return {
            package: packageJSONPath
        };
    }

    const directory = path.dirname(packageJSONPath);
    const updatePath = (itemPath: string) => normalizePath(path.join(directory, itemPath));

    return {
        package: packageJSONPath,
        title: packageJSON.title || packageJSON.name,
        icon: packageJSON.icon ? updatePath(packageJSON.icon) : undefined,
        main: packageJSON.main ? updatePath(packageJSON.main) : undefined,
        files: packageJSON.files?.map(updatePath)
    }
}

async function maybePull(storage: Storage, app: App) {
    if (await storage.hello())
        return null;

    const remoteVersion = await getRemoteVersion(storage, path.dirname(app.package));

    const pathComponents = app.package.split("/").slice(0, -1);
    const directory = pathComponents.join("/");
    let version = null;
    while (pathComponents.length && !version) {
        version = storage.client.rsync.getSavedSnapshotAndVersion(directory)?.version;
        pathComponents.pop();
    }

    if (!version || version !== remoteVersion) {
        fs.mkdirSync(path.join(SyncService.config.dir, directory), { recursive: true });

        // update package
        await storage.client.rsync.pull(app.package, { force: true });
        app = parsePackageJSON(app.package);

        if (!app)
            return null

        const files = app.files || [];

        if (app.icon) {
            fs.mkdirSync(path.resolve(SyncService.config.dir, path.dirname(app.icon)), { recursive: true });
            files.push(app.icon);
        }

        storage.client.rsync.baseDir = SyncService.config.dir;

        SyncService.status.addSyncingKey(app.title, SyncDirection.PULL, storage.origin);
        const pullPromises = app.files.map(item => storage.client.rsync.pull(item, {
            force: true,
            progress(info) {
                SyncService.status.updateSyncProgress(app.title, info)
            }
        }));

        const onFinish = () => {
            fs.writeFileSync(path.resolve(SyncService.config.dir, directory, syncFileName), JSON.stringify({ version: remoteVersion }));
            SyncService.status.removeSyncingKey(app.title);

            storage.addKey(app.package);
            SyncService.config.save();
        }

        Promise.all(pullPromises).then(onFinish);
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