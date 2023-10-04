import fs from "fs";
import {join} from "path";

const initClient: (client: any) => typeof fs.promises = client => client instanceof Function ? client() : client

export function fsInit(client, getBaseDir: () => string) {
    return {
        async readDir(key: string){
            return (await initClient(client).readdir(join(getBaseDir(), key), {withFileTypes: true})).map(item => ({
                    name: item.name,
                    key: (key ? key + "/" : "") + item.name,
                    isDirectory: item.isDirectory instanceof Function
                        ? item.isDirectory()
                        : (item.isDirectory as unknown as boolean)
                })
            );
        },
        async getFileContents(key: string){
            const data = await initClient(client).readFile(join(getBaseDir(), key));
            return data.toString();
        },
        updateFile(key: string, contents: string){
            return initClient(client).writeFile(join(getBaseDir(), key), contents);
        },
        deleteFile(key: string){
            return initClient(client).rm(join(getBaseDir(), key), {force: true, recursive: true});
        }
    }
}
