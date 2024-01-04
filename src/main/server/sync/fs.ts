import fs from "fs";
import path from "path";
import os from "os";
import { normalizePath } from "./utils";
import { SyncService } from "./service";

const getClientFS = (origin: string) => {
    if (!origin)
        return fs.promises;

    const syncClient = SyncService.config.storages.find(storage => origin === storage.origin)?.client?.fs;
    if(!syncClient)
        throw new Error(`Sync Client not initialized for ${origin}`)

    return syncClient.post();
}

const localFilePath = (key: string) => normalizePath(path.join(SyncService.config?.dir || os.homedir(), key));

export default {
    async readDir(origin: string, key: string) {
        const fsClient = getClientFS(origin);
        const filePath = origin 
            ? (key ? key : ".") 
            : localFilePath(key);
        return (await fsClient.readdir(filePath, { withFileTypes: true })).map(item => ({
            name: item.name,
            key: (key ? key + "/" : "") + item.name,
            isDirectory: item.isDirectory instanceof Function
                ? item.isDirectory()
                : (item.isDirectory as unknown as boolean)
        })
        );
    },
    async getFileContents(origin: string, key: string) {
        const fsClient = getClientFS(origin);
        const filePath = origin ? key : localFilePath(key);
        const data = await fsClient.readFile(filePath);
        return data.toString();
    },
    updateFile(origin: string, key: string, contents: string) {
        const filePath = origin ? key : localFilePath(key);
        return getClientFS(origin).writeFile(filePath, contents);
    },
    deleteFile(origin: string, key: string) {
        const filePath = origin ? key : localFilePath(key);

        if(SyncService.config?.storages){
            for (const storage of SyncService.config.storages) {
                if(!storage.keys)
                    continue;

                for(const syncedKey of storage.keys){
                    if(syncedKey === key){
                        storage.removeKey(key);
                        SyncService.config.save();
                        break;
                    }
                }
            }
        }


        return getClientFS(origin).rm(filePath, { force: true, recursive: true });
    }
}