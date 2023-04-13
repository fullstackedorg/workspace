import "./es-fix";
import Server from '@fullstacked/webapp/server';
import ts from "typescript";
import fs from "fs";
import {extname, resolve} from "path";
import createListener from "@fullstacked/webapp/rpc/createListener";

const server = new Server();
server.start();

export default server.serverHTTP;

const files: ts.MapLike<{ version: number }> = {};

const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => Object.keys(files),
    getScriptVersion: fileName => files[fileName] && files[fileName].version.toString(),
    getScriptSnapshot: fileName => {
        if (!fs.existsSync(fileName)) return undefined;
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCurrentDirectory: process.cwd,
    getCompilationSettings: () => ({
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.React,
    }),
    getDefaultLibFileName: options => {
        let lib = ts.getDefaultLibFilePath(options);
        if(!fs.existsSync(lib))
            lib = lib.replace(__dirname, resolve(process.cwd(), "node_modules", "typescript", "lib"))
        return lib;
    },
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
};

const languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

export const tsAPI = {
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
    getFileContents(fileName: string){
        return fs.readFileSync(fileName).toString();
    },
    updateDoc(fileName: string, contents: string){
        fs.writeFileSync(fileName, contents);
        if(!files[fileName]) files[fileName] = {version: 0};
        else files[fileName].version++;
        return languageService.getSemanticDiagnostics(fileName);
    },
    getCompletions(fileName: string, pos: number){
        return languageService.getCompletionsAtPosition(fileName, pos, {});
    }
}

server.addListener(createListener(tsAPI))

server.pages["/"].addInHead(`<title>FullStacked IDE</title>`)
