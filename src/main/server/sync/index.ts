import { Listener } from "@fullstacked/webapp/server";
import { createHandler } from "@fullstacked/webapp/rpc/createListener";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { RemoteStorageResponseType, Sync } from "./sync";
import { IncomingMessage } from "http";
import { homedir } from "os";
import path from "path"
import { normalizePath } from "./utils";
import fsAPI from "./fs";
import fs from "fs";
import { Status } from "@fullstacked/sync/constants";

export default class extends BackendTool {
    api = {
        async storageEndpoints() {
            const endpoints : {
                endpoint: string,
                name: string,
                helloResponse: RemoteStorageResponseType
            }[] = [];

            if(!Sync.config?.directory)
                return endpoints;

            let defaultSyncClient = {
                endpoint: Sync.defaultSyncClient.fs.origin,
                name: Sync.defaultSyncClient.fs.origin,
                helloResponse: await Sync.defaultSyncClient.hello()
            };

            if(Sync.config.storages) {
                const knownStorages = Object.entries(Sync.config.storages);
                for (const [endpoint, storage] of knownStorages) {
                    const syncClient = Sync.getSyncClient(endpoint);

                    // we might have named the default storage
                    if(syncClient === Sync.defaultSyncClient && storage.name) {
                        defaultSyncClient.name = storage.name;
                        continue;
                    }


                    endpoints.push({
                        name: storage.name,
                        endpoint,
                        helloResponse: await syncClient.hello()
                    })
                }
            }

            // don't show storage cluster endpoint as a storage
            if (typeof defaultSyncClient.helloResponse !== "object" || defaultSyncClient.helloResponse.error !== "storages_cluster")
                endpoints.push(defaultSyncClient);

            return endpoints;
        },
        initSync(this: { req: IncomingMessage }) {
            return initSync(this.req.headers?.cookie);
        },
        setDirectory: (directory: string) => {
            Sync.setDirectory(directory)
        },
        updateStorageName(origin: string, name: string) {
            Sync.setStorageName(origin, name)
        },
        mainDirectory: () => ({
            dir: normalizePath(Sync.config?.directory || homedir()),
            sep: path.sep
        }),
        syncConflicts: () => Sync.status?.conflicts,
        dismissSyncError(errorIndex: number) {
            Sync.status.errors.splice(errorIndex, 1);
            Sync.sendStatus();
        },
        push(key: string, origin: string){
            // make sure key exists
            if (!fs.existsSync(path.resolve(Sync.config.directory, key))) {
                Sync.sendError(`Trying to push [${key}], but does not exists`);
                return;
            }

            // get sync client for endpoint
            const syncClient = Sync.getSyncClient(origin);
            if(!syncClient){
                Sync.sendError(`Cannot find any SyncClient for origin [${origin}]`);
                return;
            }

            syncClient.rsync.baseDir = Sync.config.directory;

            const onPushDone = (response: Status) => {
                Sync.removeSyncingKey(key);

                Sync.addKey(origin, key)

                if (response.status === "error")
                    Sync.sendError(response.message);
            }

            // sync
            Sync.addSyncingKey(key, "push");
            syncClient.rsync.push(key, {
                filters: [".gitignore"],
                progress(info) {
                    Sync.updateSyncingKeyProgress(key, info)
                }
            }).then(onPushDone);
        },
        async pull(origin: string, key: string) {
            // get sync client for endpoint
            const syncClient = Sync.getSyncClient(origin);
            if(!syncClient){
                Sync.sendError(`Cannot find any SyncClient for origin [${origin}]`);
                return;
            }

            // make sure key exists on remote
            try {
                await syncClient.fs.post().access(key)
            } catch (e) {
                console.log(e);
                Sync.sendError(`Key [${key}] does not exists on cloud storage [${origin}].`);
                return;
            }

            syncClient.rsync.baseDir = Sync.config.directory;

            const onPullDone = (response: Status) => {
                Sync.removeSyncingKey(key);

                if (response.status === "error")
                    Sync.sendError(response.message);
            }

            Sync.addSyncingKey(key, "pull");
            syncClient.rsync.pull(key, {
                progress(info) {
                    Sync.updateSyncingKeyProgress(key, info)
                }
            }).then(onPullDone);
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
            Sync.ws.add(ws);
            ws.send(JSON.stringify(Sync.status))
            ws.on("close", () => Sync.ws.delete(ws));
        }
    };
}

async function initSync(cookie: string) {
    // init status only if null or undefined
    if (!Sync.status)
        Sync.status = {};
    Sync.sendStatus(false);

    // try to load the configs
    let response = await Sync.loadConfigs();
    if (response) {
        // dont force a user without configs to init sync
        if (typeof response === "object" && response.error === "no_config") {
            Sync.status = null;
            Sync.sendStatus(false);
        }

        return response;
    }


    // // make sure local directory is fine
    // response = Sync.directoryCheck();
    // if (response)
    //     return response;

    // // try to reach the storage endpoint
    // response = await Sync.hello();
    // if (response)
    //     return response;

    // if (Sync.config.authorization)
    //     Sync.setAuthorization(Sync.config.authorization)

    // // pull all saved keys
    // if (Sync.config.keys?.length) {
    //     Promise.all(Sync.config?.keys.map(key => fsCloud.sync(key)))
    //         .then(startSyncingInterval);
    // }
    // else {
    //     Sync.config.keys = [];
    //     startSyncingInterval()
    // }

    // // sync files at the root of /home
    // // that starts with .git* 
    // // and .profile file
    // if (process.env.USE_CLOUD_CONFIG) {
    //     const dotFiles = await SyncClient.fs.post().readdir(Sync.config.directory, { withFileTypes: true });
    //     dotFiles.forEach(({ name }) => {
    //         if (name !== ".profile" && !name.startsWith(".git"))
    //             return;

    //         fsCloud.sync(name, {
    //             save: false,
    //             progress: false
    //         });
    //     });
    // }

    // in case there's nothing to pull, send the current status
    // to switch from initializing... to something else
    Sync.sendStatus();
    return true;
}

let syncingIntervalRunning = false;
function startSyncingInterval(){
    // start only once
    if(syncingIntervalRunning) return;
    syncingIntervalRunning = true;

    setInterval(sync, Sync.syncInterval);
}

function sync(){
    // sync files at the root of /home
    // that starts with .git* 
    // and .profile file

    // if (process.env.USE_CLOUD_CONFIG) {
    //     fs.readdirSync(Sync.config.directory).forEach(file => {
    //         if (file !== ".profile" && !file.startsWith(".git"))
    //             return;

    //         fsLocal.sync(file, {
    //             save: false,
    //             progress: false
    //         });
    //     });
    // }

    // if (!Sync.config?.keys?.length) {
    //     Sync.sendStatus();
    //     return;
    // }

    // Sync.config?.keys.forEach(key => fsLocal.sync(key))
}

