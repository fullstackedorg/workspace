import fs from "fs";
import {join} from "path";
import {normalizePath} from "./utils";
import {Sync} from "./index";

const initClient: (client: any) => typeof fs.promises = client => client instanceof Function ? client() : client

export function fsInit(client, getBaseDir: () => string) {
    const filePath = (key) => normalizePath(join(getBaseDir(), key));

    return {
        async readDir(key: string){
            let readDir: fs.Dirent[];
            try {
                readDir = await initClient(client).readdir(filePath(key), {withFileTypes: true});
            }catch (e) {
                Sync.updateStatus({
                    status: "error",
                    message: e.message
                });
                return []
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
            let data: Buffer;
            try{
                data = await initClient(client).readFile(filePath(key));
            }catch (e){
                Sync.updateStatus({
                    status: "error",
                    message: e.message
                });
                return "";
            }

            return data.toString();
        },
        updateFile(key: string, contents: string){
            try{
                return initClient(client).writeFile(filePath(key), contents);
            }catch (e) {
                Sync.updateStatus({
                    status: "error",
                    message: e.message
                });
            }
        },
        deleteFile(key: string){
            Sync.removeKey(key);
            try{
                return initClient(client).rm(filePath(key), {force: true, recursive: true});
            }catch (e){
                Sync.updateStatus({
                    status: "error",
                    message: e.message
                });
            }
        }
    }
}
