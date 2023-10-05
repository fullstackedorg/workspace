import fs from "fs";
import path, {join} from "path";
import {normalizePath} from "./utils";

const initClient: (client: any) => fs.promises = client => client instanceof Function ? client() : client

export function fsInit(client, getBaseDir: () => string) {
    const filePath = (key) => normalizePath(join(getBaseDir(), key));

    return {
        async readDir(key: string){
            return (await initClient(client).readdir(filePath(key), {withFileTypes: true})).map(item => ({
                    name: item.name,
                    key: (key ? key + "/" : "") + item.name,
                    isDirectory: item.isDirectory instanceof Function
                        ? item.isDirectory()
                        : (item.isDirectory as unknown as boolean)
                })
            );
        },
        async getFileContents(key: string){
            const data = await initClient(client).readFile(filePath(key));
            return data.toString();
        },
        updateFile(key: string, contents: string){
            return initClient(client).writeFile(filePath(key), contents);
        },
        deleteFile(key: string){
            return initClient(client).rm(filePath(key), {force: true, recursive: true});
        }
    }
}
