import "./es-fix";
import Server from '@fullstacked/webapp/server';
import ts from "typescript";
import fs from "fs";
import {extname, resolve} from "path";
import createListener from "@fullstacked/webapp/rpc/createListener";
import {WebSocketServer} from "ws";
import {exec} from "child_process";
import httpProxy from "http-proxy";
import * as fastQueryString from "fast-querystring";
import cookie from "cookie";

const server = new Server();
server.start();

export default server.serverHTTP;

const files: ts.MapLike<{ version: number }> = {};

const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => Object.keys(files),
    getScriptVersion: fileName => files[fileName] && files[fileName].version.toString(),
    getScriptSnapshot: fileName => {
        if (!fs.existsSync(fileName)) return undefined
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

export function isTokenKind(kind: ts.SyntaxKind) {
    return kind >= ts.SyntaxKind.FirstToken && kind <= ts.SyntaxKind.LastToken;
}

function getTokenAtPosition(parent: ts.Node, pos: number, sourceFile?: ts.SourceFile) {
    if (pos < parent.pos || pos >= parent.end)
        return;
    if (isTokenKind(parent.kind))
        return parent;
    if (sourceFile === undefined)
        sourceFile = parent.getSourceFile();
    return getTokenAtPositionWorker(parent, pos, sourceFile);
}

function getTokenAtPositionWorker(node: ts.Node, pos: number, sourceFile: ts.SourceFile) {
    outer: while (true) {
        for (const child of node.getChildren(sourceFile)) {
            if (child.end > pos && child.kind !== ts.SyntaxKind.JSDocComment) {
                if (isTokenKind(child.kind))
                    return child;
                // next token is nested in another node
                node = child;
                continue outer;
            }
        }
        return;
    }
}

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
    updateFile(filename: string, contents: string){
        fs.writeFileSync(filename, contents);
        if(!files[filename]) files[filename] = {version: 0};
        else files[filename].version++;
    },
    diagnostics(filename: string){
        return languageService.getSemanticDiagnostics(filename)
            .concat(languageService.getSyntacticDiagnostics(filename));
    },
    completions(filename: string, pos: number){
        return languageService.getCompletionsAtPosition(filename, pos, {});
    },
    typeDefinition(filename: string, pos: number){
        console.log(languageService.getProgram().getTypeChecker().getTypeAtLocation(getTokenAtPosition(program.getSourceFile(filename), pos)));
        const types = languageService.getTypeDefinitionAtPosition(filename, pos);
        return types?.map(reference => {
            const contents = fs.readFileSync(reference.fileName).toString();
            return contents.slice(reference.textSpan.start, reference.textSpan.start + reference.textSpan.length);
        });
    }
}

server.addListener(createListener(tsAPI));

server.pages["/"].addInHead(`<title>FullStacked IDE</title>`);

const commandsWS = new WebSocketServer({noServer: true});
let command;
commandsWS.on('connection', (ws) => {
    ws.on('message', data => {
        if(data.toString() === "##KILL##"){
            command.kill();
            return;
        }

        command = exec(data.toString());
        command.stdout.on('data', chunk => ws.send(chunk.toString()));
        command.stderr.on('data', chunk => ws.send(chunk.toString()));
        command.on('close', () => ws.send("##END##"))
    });
});

const proxy = httpProxy.createProxy({});


server.serverHTTP.on('upgrade', (req, socket, head) => {
    const cookies = cookie.parse(req.headers.cookie ?? "");

    if(cookies.port){
        return new Promise(resolve => {
            proxy.ws(req, socket, head, {target: `http://localhost:${cookies.port}`}, resolve);
        })
    }

    const domainParts = req.headers.host.split(".");
    const firstDomainPart = domainParts.shift();
    const maybePort = parseInt(firstDomainPart);
    if(maybePort.toString() === firstDomainPart && maybePort > 2999){
        return new Promise(resolve => {
            proxy.ws(req, socket, head, {target: `http://localhost:${firstDomainPart}`}, resolve);
        })
    }


    if(req.url !== "/fullstacked-commands") return;

    commandsWS.handleUpgrade(req, socket, head, (ws) => {
        commandsWS.emit('connection', ws, req);
    });
});


server.addListener({
    prefix: "global",
    handler(req, res) {
        const queryString = fastQueryString.parse(req.url.split("?").pop());
        const cookies = cookie.parse(req.headers.cookie ?? "");
        if (queryString.test === "credentialless") {
            res.end(`<script>window.parent.postMessage({credentialless: ${cookies.test !== "credentialless"}}); </script>`)
            return;
        }

        if (queryString.port) {
            res.setHeader("Set-Cookie", cookie.serialize("port", queryString.port));
            res.end(`<script>
                const url = new URL(window.location.href); 
                url.searchParams.delete("port"); 
                window.location.href = url.toString();
            </script>`);
            return;
        }

        if (cookies.port) {
            return new Promise<void>(resolve => {
                proxy.web(req, res, {target: `http://localhost:${cookies.port}`}, () => {
                    if (!res.headersSent) {
                        res.setHeader("Set-Cookie", cookie.serialize("port", cookies.port, {expires: new Date(0)}));
                        res.end(`Port ${cookies.port} is down.`);
                    }
                    resolve();
                });
            })
        }

        const domainParts = req.headers.host.split(".");
        const firstDomainPart = domainParts.shift();
        const maybePort = parseInt(firstDomainPart);
        if (maybePort.toString() === firstDomainPart && maybePort > 2999) {
            return new Promise<void>(resolve => {
                proxy.web(req, res, {target: `http://localhost:${firstDomainPart}`}, () => {
                    if (!res.headersSent) {
                        res.end(`Port ${firstDomainPart} is down.`);
                    }
                    resolve();
                });
            })
        }
    }
})
