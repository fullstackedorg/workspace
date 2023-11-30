import fs from "fs";
import {fsInit} from "./fs-init";
import {homedir} from "os";
import {Sync} from "./index";
import {resolve} from "path";
import { RsyncHTTP2Client } from "@fullstacked/sync/http2/client";

const getBaseDir = () => Sync.config?.directory || homedir();

export const fsLocal = {
    ...fsInit(fs.promises, getBaseDir),

    resolveConflict(baseKey: string, key: string, contents: string){
        const filePath = resolve(getBaseDir(), key);
        fs.writeFileSync(filePath, contents);
        Sync.resolveConflict(baseKey, key);
    },

    // push files to cloud
    async sync(key: string, save = true){
        // cannot push/pull at same time
        if(Sync.status?.syncing && Sync.status.syncing[key]) return;

        // dont push with conflicts
        if(Sync.status.conflicts && Sync.status.conflicts[key]) return;

        // make sure key exists
        if(!fs.existsSync(resolve(getBaseDir(), key))) {
            Sync.sendError(`Trying to push [${key}], but does not exists`);
            return;
        }

        const syncClient = new RsyncHTTP2Client(Sync.endpoint);
        syncClient.baseDir = getBaseDir();
        Sync.addSyncingKey(key, "push");
        const response = await syncClient.push(key, {
            filters: [".gitignore"],
            progress(info){
                Sync.updateSyncingKeyProgress(key, info)
            }
        });
        Sync.removeSyncingKey(key);
        if(save)
            Sync.addKey(key);

        if(response.status === "error")
            Sync.sendError(response.message);
    }
}
