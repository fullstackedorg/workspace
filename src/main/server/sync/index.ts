import { Listener } from "@fullstacked/webapp/server";
import { createHandler } from "@fullstacked/webapp/rpc/createListener";
import { BackendTool, WebSocketRegisterer } from "../backend";
import path from "path"
import fsAPI from "./fs";
import { SyncService } from "./service";
import os from "os";
import Storage from "./storage";
import { SyncDirection } from "./types";
import { Status } from "@fullstacked/sync/constants";
import fs from "fs";
import { scan } from "@fullstacked/sync/utils";
import { normalizePath } from "./utils";

export default class Sync extends BackendTool {
    static DEFAULT_STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || "https://auth.fullstacked.cloud/storages";

    api = {
        syncInit() {
            return SyncService.initialize();
        },
        directory: {
            main() {
                return {
                    dir: process.env.MAIN_DIRECTORY || os.homedir(),
                    sep: path.sep
                }
            },
            check(){
                return SyncService.config.directoryCheck();
            },
            set(directory: string) {
                SyncService.config.directory = directory;
                return SyncService.config.directoryCheck(directory);
            }
        },
        storages: {
            initialize() {
                if (!SyncService.config || !SyncService.status)
                    throw new Error("Sync isn't initialized");

                if (Sync.DEFAULT_STORAGE_ENDPOINT && !SyncService.config.storages.find(({ origin }) => origin === Sync.DEFAULT_STORAGE_ENDPOINT)) {
                    SyncService.config.storages.push(new Storage({ origin: Sync.DEFAULT_STORAGE_ENDPOINT }))
                }

                const storageHello = (storage: Storage) => new Promise<void>(resolve => {
                    storage.hello().then(helloResponse => {
                        if (helloResponse && helloResponse?.error !== "storages_cluster" && !isRandomClusterChild(storage))
                            SyncService.status.sendError(`Cannot initialized [${storage.name || storage.origin}]`);

                        resolve();
                    })
                });

                Promise.all(SyncService.config.storages.map(storageHello))
                    .then(() => SyncService.status.sendStatus(true));
            },
            list() {
                const getStorage = async (storage: Storage) => {
                    const hello = await storage.hello();
                    return {
                        ...storage,
                        hello
                    }
                }

                return Promise.all(SyncService.config?.storages?.map(getStorage));
            },
            hello(origin: string) {
                const storage = getStorageByOrigin(origin);
                return storage.hello(false);
            },
            async auth(origin: string, { url, ...body }: any) {
                const storage = getStorageByOrigin(origin);

                // host.docker.internal represents your host machine localhost
                if (process.env.DOCKER_RUNTIME) {
                    url = url.replace(/(localhost|0.0.0.0)/, "host.docker.internal")
                }

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "user-agent": this.req.headers["user-agent"]
                    },
                    body: JSON.stringify(body)
                });

                const authorization = await response.text();

                storage.client.authorization = authorization;

                // use same authorization for all child storages
                if (storage.isCluster) {
                    SyncService.config.storages
                        .filter(({ cluster }) => cluster === storage.origin)
                        .forEach(storage => storage.client.authorization = authorization)
                }

                SyncService.config.save();
            },
            add(origin: string) {
                const storage = getStorageByOrigin(origin, false);

                if (storage)
                    storage.keys = [];
                else
                    SyncService.addStorage({ origin });

                SyncService.config.save();
            },
            update(origin: string, name: string) {
                const storage = getStorageByOrigin(origin);

                storage.name = name;
                SyncService.config.save();
            },
            remove(origin: string) {
                const storage = getStorageByOrigin(origin);

                if (storage.cluster)
                    delete storage.keys;
                else {
                    const index = SyncService.config.storages.findIndex(storage => storage.origin === origin);
                    SyncService.config.storages.splice(index, 1);
                }

                SyncService.config.save();
            },
        },
        sync: {
            sync(direction: SyncDirection){
                if (!SyncService.config || !SyncService.status)
                    throw new Error("Sync isn't initialized");

                const syncFunction = direction === SyncDirection.PUSH
                    ? push
                    : pull;

                SyncService.config.storages.forEach(async storage => {
                    if(!storage.keys || await storage.hello()) 
                        return;

                    storage.keys.forEach(itemKey => {
                        syncFunction(storage.origin, itemKey);
                    });
                });
            },
            push,
            pull,
            keys: {
                list() {
                    let syncedKeys = {};
                     SyncService.config.storages
                        .forEach(({ keys, origin }) => {
                            if(keys?.length)
                                syncedKeys[origin] = keys;
                        })

                    return syncedKeys;
                }
            },
            conflicts: {
                list() { },
                resolve() { }
            },
            errors: {
                dismiss(errorIndex: number) {
                    SyncService.status.dismissError(errorIndex)
                }
            },
            apps: {
                async list(origin: string) {
                    const storage = getStorageByOrigin(origin);
                    return storage.listApps();
                }
            }
        }
    };

    listeners: (Listener & { prefix?: string; })[] = [
        {
            prefix: "/fs",
            handler: createHandler(fsAPI)
        }
    ];
    websocket: WebSocketRegisterer = {
        path: "/fullstacked-sync",
        onConnection(ws) {
            SyncService.status?.addWS(ws)
        }
    };
}

const isRandomClusterChild = (storage: Storage) => storage.cluster && !storage.keys;

export function getStorageByOrigin(origin: string, throwErr = true) {
    const storage = SyncService.config.storages.find(storage => storage.origin === origin);
    if (!storage && throwErr)
        throw new Error(`Cannot find storage for origin [${origin}]`);

    return storage;
}

async function push(origin: string, itemKey: string) {
    const storage = getStorageByOrigin(origin);

    if (await storage.hello()) {
        SyncService.status.sendError(`Cannot sync to [${origin}]`);
        return;
    }

    storage.client.rsync.baseDir = SyncService.config.dir;

    SyncService.status.addSyncingKey(itemKey, SyncDirection.PUSH, origin);
    const pushPromise = storage.client.rsync.push(itemKey, {
        filters: [".gitignore"],
        progress(info) {
            SyncService.status.updateSyncProgress(itemKey, info)
        }
    });

    const onPushFinish = (response: Status) => {
        SyncService.status.removeSyncingKey(itemKey);
        storage.addKey(itemKey);

        SyncService.config.save();

        if (response.status === "error")
            SyncService.status.sendError(response.message);
        else if(response.status === "none")
            return;

        if(fs.statSync(path.join(SyncService.config.dir, itemKey)).isFile())
            return;
       
        const packageJSONs = findAllPackageJSON(SyncService.config.dir, itemKey);

        packageJSONs.forEach((packageJSON) => syncApp(packageJSON, storage));
    }

    pushPromise.then(onPushFinish);
}

async function pull(origin: string, itemKey: string) {
    const storage = getStorageByOrigin(origin);

    if (await storage.hello()) {
        SyncService.status.sendError(`Cannot sync from [${origin}]`);
        return;
    }

    storage.client.rsync.baseDir = SyncService.config.dir;

    SyncService.status.addSyncingKey(itemKey, SyncDirection.PULL, origin);
    const pullPromise = storage.client.rsync.pull(itemKey, {
        progress(info) {
            SyncService.status.updateSyncProgress(itemKey, info)
        }
    });

    const onPullFinish = (response: Status) => {
        SyncService.status.removeSyncingKey(itemKey);
        storage.addKey(itemKey);

        SyncService.config.save();

        if (response.status === "error")
            SyncService.status.sendError(response.message);
    }

    pullPromise.then(onPullFinish);
}

function findAllPackageJSON(baseDir: string, dir: string) {
    return scan(baseDir, dir, [".gitignore"])
        .filter(([itemPath]) => itemPath.endsWith("/package.json"))
        .map(([packageJSONPath]) => packageJSONPath);
}

async function syncApp (packageJSON: string, storage: Storage) {
    let json: {
        name: string,
        title: string,
        files: string[]
    };
    try {
        json = JSON.parse(fs.readFileSync(path.resolve(SyncService.config.dir, packageJSON)).toString());
    }catch (e) {
        SyncService.status.sendError(`Unable to parse [${packageJSON}]`);
        return;
    }

    if(!json.files)
        return;

    const dir = path.dirname(packageJSON);
    const title = json.title || json.name;
    
    SyncService.status.addSyncingKey(title, SyncDirection.PUSH, storage.origin);
    const pushPromises = json.files.map(item => storage.client.rsync.push(normalizePath(path.join(dir, item)), {
        force: true,
        progress(info) {
            SyncService.status.updateSyncProgress(title, info);
        }
    }));

    const onFinish = (responses: Status[]) => {
        SyncService.status.removeSyncingKey(title);

        responses.forEach(response => {
            if (response?.status === "error")
                SyncService.status.sendError(response.message)
        })
    }

    Promise.all(pushPromises).then(onFinish);
}