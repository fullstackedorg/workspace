import { Listener } from "@fullstacked/webapp/server";
import { fsLocal } from "./fs/local";
import { fsCloud } from "./fs/cloud";
import { createHandler } from "@fullstacked/webapp/rpc/createListener";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { Sync } from "./sync";
import { IncomingMessage } from "http";
import { SyncClient } from "./client";
import fs from "fs";
import { homedir } from "os";
import path from "path"
import { normalizePath } from "./utils";

export default class extends BackendTool {
    api = {
        initSync(this: { req: IncomingMessage }) {
            return initSync(this.req.headers?.cookie);
        },
        mainDirectory: () => ({
            dir: normalizePath(Sync.config?.directory || homedir()),
            sep: path.sep
        }),
        storageEndpoint: () => SyncClient.rsync.endpoint,
        savedSyncKeys: () => Sync.config?.keys,
        syncConflicts: () => Sync.status?.conflicts,
        dismissSyncError(errorIndex: number) {
            Sync.status.errors.splice(errorIndex, 1);
            Sync.sendStatus();
        },
        sync,
    };
    listeners: (Listener & { prefix?: string; })[] = [
        {
            prefix: "/fs-local",
            handler: createHandler(fsLocal)
        },
        {
            prefix: "/fs-cloud",
            handler: createHandler(fsCloud)
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

    // copy this request cookie so we can maybe put the authorization in there
    SyncClient.fs.headers.cookie = cookie;
    SyncClient.rsync.headers.cookie = cookie;

    // try to load the configs
    let response = await Sync.loadConfigs();
    if (response) {
        // dont force a user without configs to init sync
        if (typeof response === "object" && response.error === "no_configs") {
            Sync.status = null;
            Sync.sendStatus(false);
        }

        return response;
    }

    // make sure local directory is fine
    response = Sync.directoryCheck();
    if (response)
        return response;

    // try to reach the storage endpoint
    response = await Sync.hello();
    if (response)
        return response;

    if (Sync.config.authorization)
        Sync.setAuthorization(Sync.config.authorization)

    // pull all saved keys
    if (Sync.config.keys?.length) {
        Promise.all(Sync.config?.keys.map(key => fsCloud.sync(key)))
            .then(startSyncingInterval);
    }
    else {
        Sync.config.keys = [];
        startSyncingInterval()
    }

    // sync files at the root of /home
    // that starts with .git* 
    // and .profile file
    if (process.env.USE_CLOUD_CONFIG) {
        const dotFiles = await SyncClient.fs.post().readdir(Sync.config.directory, { withFileTypes: true });
        dotFiles.forEach(({ name }) => {
            if (name !== ".profile" && !name.startsWith(".git"))
                return;

            fsCloud.sync(name, {
                save: false,
                progress: false
            });
        });
    }

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
    if (process.env.USE_CLOUD_CONFIG) {
        fs.readdirSync(Sync.config.directory).forEach(file => {
            if (file !== ".profile" && !file.startsWith(".git"))
                return;

            fsLocal.sync(file, {
                save: false,
                progress: false
            });
        });
    }

    if (!Sync.config?.keys?.length) {
        Sync.sendStatus();
        return;
    }

    Sync.config?.keys.forEach(key => fsLocal.sync(key))
}

