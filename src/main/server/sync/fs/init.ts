import fs from "fs";
import {join} from "path";
import {normalizePath} from "../utils";
import {Sync} from "../sync";
import { SyncClient } from "../client";

const initClient: (client: any) => typeof fs.promises = client => client instanceof Function ? client() : client

export function fsInit(client, getBaseDir: () => string) {
    const filePath = (key) => normalizePath(join(getBaseDir(), key));

    return {
        async readDir(key: string){
            const readDir = await initClient(client).readdir(filePath(key), {withFileTypes: true});

            if(readDir instanceof Error){
                throw readDir;
            }

            return readDir.map(item => ({
                    name: item.name,
                    key: (key ? key + "/" : "") + item.name,
                    isDirectory: item.isDirectory instanceof Function
                        ? item.isDirectory()
                        : (item.isDirectory as unknown as boolean)
                })
            );
        },
        async getFileContents(key: string){
            let data = await initClient(client).readFile(filePath(key));
            return data.toString();
        },
        updateFile(key: string, contents: string){
            return initClient(client).writeFile(filePath(key), contents);
        },
        deleteFile(key: string){
            Sync.removeKey(key);
            return initClient(client).rm(filePath(key), {force: true, recursive: true});
        }
    }
}
