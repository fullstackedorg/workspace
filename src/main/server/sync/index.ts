import { Listener } from "@fullstacked/webapp/server";
import { createHandler } from "@fullstacked/webapp/rpc/createListener";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { RemoteStorageResponseType, Sync, SyncInitResponse } from "./sync";
import { IncomingMessage } from "http";
import { homedir } from "os";
import path from "path"
import { normalizePath } from "./utils";
import fsAPI from "./fs";
import fs from "fs";
import { Status } from "@fullstacked/sync/constants";

export type Endpoint = {
    origin: string,
    cluster?: string,
    name?: string,
    helloResponse?: RemoteStorageResponseType
}

export default class extends BackendTool {
    api = {
        async storageEndpoints(all = false): Promise<Endpoint[]> {
            if(!Sync.config)
                return [];


            const storagesOrigins: {
                [origin: string]: string
            } = {
                [Sync.DEFAULT_STORAGE_ENDPOINT]: ""
            };

            if (Sync.config.storages) {
                Object.keys(Sync.config.storages)
                    .forEach(origin => {
                        if (!storagesOrigins[origin])
                            storagesOrigins[origin] = Sync.config.storages[origin].name;
                    });
            }

            const storagesOriginsArr = Object.keys(storagesOrigins);
            const endpoints: Endpoint[] = [];
            for (let i = 0; i < storagesOriginsArr.length; i++) {
                const origin = storagesOriginsArr[i];

                let name = storagesOrigins[origin] || origin;

                const syncClient = Sync.getSyncClient(origin);

                const helloResponse = syncClient ? await syncClient.hello() : null;

                if (helloResponse && typeof helloResponse === "object" && helloResponse.error === "storages_cluster") {
                    name = helloResponse.name || origin;

                    for (const clusterEndpoint of helloResponse.endpoints) {
                        const clusterEndpointOrigin = typeof clusterEndpoint === "string"
                            ? clusterEndpoint
                            : clusterEndpoint.url;

                        if (!storagesOriginsArr.includes(clusterEndpointOrigin)) {
                            if (typeof clusterEndpoint !== "string")
                                storagesOrigins[clusterEndpointOrigin] = clusterEndpoint.name;

                            storagesOriginsArr.push(clusterEndpointOrigin);
                        }
                    }

                    if(!all)
                        continue;
                }

                if (syncClient || all) {
                    endpoints.push({
                        name,
                        origin,
                        helloResponse
                    })
                }
            }

            return endpoints;
        },
        storageHello(endpoint: string) {
            const syncClient = Sync.getSyncClient(endpoint);

            if (!syncClient)
                throw new Error(`No sync client for [${endpoint}]`);

            return syncClient.hello();
        },
        async authenticate(origin: string, data: any) {
            // host.docker.internal represents your host machine localhost
            if (process.env.DOCKER_RUNTIME) {
                data.url = data.url.replace(/(localhost|0.0.0.0)/, "host.docker.internal")
            }

            const response = await fetch(data.url, {
                method: "POST",
                headers: {
                    "user-agent": this.req.headers["user-agent"]
                },
                body: JSON.stringify(data)
            });

            const token = await response.text();

            Sync.setAuthorization(origin, token);
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
        removeStorage(origin: string) {
            Sync.removeStorage(origin);
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
        push(key: string, origin: string) {
            // make sure key exists
            if (!fs.existsSync(path.resolve(Sync.config.directory, key))) {
                Sync.sendError(`Trying to push [${key}], but does not exists`);
                return;
            }

            // get sync client for endpoint
            const syncClient = Sync.getSyncClient(origin);
            if (!syncClient) {
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
            if (!syncClient) {
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

async function initSync(cookie: string): Promise<SyncInitResponse> {
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
function startSyncingInterval() {
    // start only once
    if (syncingIntervalRunning) return;
    syncingIntervalRunning = true;

    setInterval(sync, Sync.syncInterval);
}

function sync() {
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

