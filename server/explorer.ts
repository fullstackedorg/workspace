import fs from "fs";
import {extname} from "path";

const LocalFS = {
    readDir(dirPath: string){
        return fs.readdirSync(dirPath).map(name => {
            const path = (dirPath === "." ? "" : (dirPath + "/")) + name;
            return {
                name,
                path,
                extension: extname(name),
                isDirectory: fs.statSync(path).isDirectory(),
            }
        });
    },
    getFileContents(filename: string){
        return fs.readFileSync(filename).toString();
    },
    updateFile(filename: string, contents: string){
        fs.writeFileSync(filename, contents);
    },
}

const CloudFS = {
    readDir(dirPath: string){
        return fs.readdirSync(dirPath).map(name => {
            const path = (dirPath === "." ? "" : (dirPath + "/")) + name;
            return {
                name,
                path,
                extension: extname(name),
                isDirectory: fs.statSync(path).isDirectory(),
            }
        });
    },
    getFileContents(filename: string){
        return fs.readFileSync(filename).toString();
    },
    updateFile(filename: string, contents: string){
        fs.writeFileSync(filename, contents);
    },
}
