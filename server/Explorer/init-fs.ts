import fs from "fs";

const initClient: (client: any) => typeof fs.promises = client => client instanceof Function ? client() : client

export function initFS(client) {
    return {
        async readDir(dirPath: string){
            return (await initClient(client).readdir(dirPath, {withFileTypes: true})).map(item => {
                const path = (dirPath === "." ? "" : (dirPath + "/")) + item.name;
                return {
                    name: item.name,
                    path,
                    isDirectory: item.isDirectory instanceof Function
                        ? item.isDirectory()
                        : (item.isDirectory as unknown as boolean)
                }
            });
        },
        async getFileContents(filename: string){
            const data = await initClient(client).readFile(filename);
            return data.toString();
        },
        updateFile(filename: string, contents: string){
            return initClient(client).writeFile(filename, contents);
        },
    }
}
