import fs from "fs";
import path from "path";
import os from "os";
import { Sync } from "./sync";
import { normalizePath } from "./utils";

const getClientFS = (origin: string) => {
    if (!origin)
        return fs.promises;

    if(origin === Sync.DEFAULT_STORAGE_ENDPOINT)
        return Sync.defaultSyncClient.fs.post();

    if (!Sync.config?.storages || !Sync.config?.storages[origin] || !Sync.config.storages[origin].client?.fs)
        throw new Error(`Sync Client not initialized for ${origin}`)

    return Sync.config.storages[origin].client.fs.post();
}

const localFilePath = (key: string) => normalizePath(path.join(Sync.config?.directory || os.homedir(), key));

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
        return getClientFS(origin).rm(filePath, { force: true, recursive: true });
    }
}