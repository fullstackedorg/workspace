import Server from '@fullstacked/webapp/server';
import ts from "typescript";
import fs from "fs";
import {extname} from "path";
import createListener from "@fullstacked/webapp/rpc/createListener";
import {WebSocketServer} from "ws";
import pty, {IPty} from "node-pty";
import httpProxy from "http-proxy";
import * as fastQueryString from "fast-querystring";
import cookie from "cookie";
import CLIParser from "fullstacked/utils/CLIParser";
import { randomUUID } from 'crypto';
import HTML from "@fullstacked/webapp/server/HTML";
import arrow from "./arrow";

export const server = new Server();

server.pages["/"].addInHead(`
<link rel="icon" type="image/png" href="/pwa/app-icons/favicon.png">
<link rel="manifest" href="/pwa/manifest.json">
<meta name="theme-color" content="#171f2e"/>`);

let token = randomUUID();
if(process.env.PASS){
    const publicFiles = [
        "/pwa/manifest.json",
        "/pwa/app-icons/favicon.png",
        "/pwa/app-icons/app-icon.png",
        "/pwa/app-icons/maskable.png"
    ]
    const loginPage = new HTML();
    loginPage.addInHead(`<meta property="og:image" content="https://files.cplepage.com/fullstacked/sharing-image.jpg">`);
    loginPage.addInHead(`<title>FullStacked IDE</title>`);
    loginPage.addInHead(`<link id="favicon" rel="shortcut icon" type="image/png" href="/pwa/app-icons/favicon.png">`);
    loginPage.addInHead(`<style>
        *{
            box-sizing: border-box;
        }
        html, body{
            background-color: #1e293c;
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
        }
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        img {
            height: 70px;
            margin: 20px;
        }
        form {
            display: flex;
            align-items: center;
            border-radius: 5px;
            box-shadow: 0 0 15px 2px #a5afc240;
            background-color: #2b3952;
            transition: 0.2s background-color;
        }
        form:hover {
            background-color: #374662;
        }
        input, button {
            background-color: transparent;
            color: #e9edf4;
            border: 1px solid #777f8c;
            font-size: large;
            margin: 0;
        }
        button {
            height: 100%;
            border-left: 0;
            border-radius: 0 5px 5px 0;
            padding: 0 10px;
            cursor: pointer;
        }
        input {
            padding: 6px 10px;
            border-radius: 5px 0 0 5px;
            outline: 0;
        }
        svg{
            vertical-align: middle;
        }
    </style>`)
    loginPage.addInBody(`
    <img src="/pwa/app-icons/app-icon.png" />
    <form action="/" method="post">
        <input type="password" name="password" />
        <button>${arrow}</button>
    </form>
    <script>
        document.querySelector("input").focus();
    </script>`);

    server.addListener({
        prefix: "global",
        async handler(req, res) {
            const cookies = cookie.parse(req.headers.cookie ?? "");
            if(cookies.token === token) return;
            if(publicFiles.includes(req.url)) return;

            const queryParams = fastQueryString.parse(req.url.split("?").pop());
            if(queryParams.token === token) {
                res.setHeader("Set-Cookie", cookie.serialize("token", token));
                return;
            }

            if(req.method === "POST"){
                let data = ""
                await new Promise((resolve) => {
                    req.on('data', chunk => data += chunk.toString());
                    req.on('end', resolve);
                });
                const body = cookie.parse(data);
                const pass = body?.password ?? "";
                if(pass === process.env.PASS){
                    res.setHeader("Set-Cookie", cookie.serialize("token", token));
                    res.writeHead(302, {location: "/"});
                    res.end();
                    return;
                }
            }

            res.setHeader("Content-Type", "text/html");
            res.end(loginPage.toString());
        }
    })
}

server.addListener({
    prefix: "global",
    handler(req, res) {
        if(req.url !== "/service-worker.js") return;
        res.setHeader("Content-Type", "application/javascript");
        res.end(`self.addEventListener('fetch', (event) => {});`);
    }
}, true);

// called with [npx fullstacked ide]
if(!process.argv.includes("ide"))
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
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCompilationSettings: () => ({
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.React,
        experimentalDecorators: true
    }),
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories
};

const languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

function isTokenKind(kind: ts.SyntaxKind) {
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
    logout(){
        token = randomUUID();
    },
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
        const diagnostics = languageService.getSemanticDiagnostics(filename)
            .concat(languageService.getSyntacticDiagnostics(filename));
        return diagnostics.map(diagnostic => {
            delete diagnostic.file;
            delete diagnostic.relatedInformation;
            return diagnostic;
        });
    },
    completions(filename: string, pos: number){
        return languageService.getCompletionsAtPosition(filename, pos, {
            allowIncompleteCompletions: true,
            allowRenameOfImportPath: true,
            allowTextChangesInNewFiles: true,
            includeAutomaticOptionalChainCompletions: true,
            includeCompletionsForImportStatements: true,
            includeCompletionsForModuleExports: true,
            includeCompletionsWithClassMemberSnippets: true,
            includeCompletionsWithObjectLiteralMethodSnippets: true,
            includeCompletionsWithInsertText: true,
            includeCompletionsWithSnippetText: true,
            jsxAttributeCompletionStyle: "auto",
            providePrefixAndSuffixTextForRename: true,
            provideRefactorNotApplicableReason: true,
        });
    },
    typeDefinition(filename: string, pos: number){
        const program = languageService.getProgram();
        const typeChecker = program.getTypeChecker();
        const token = getTokenAtPosition(program.getSourceFile(filename), pos);
        const type = typeChecker.getTypeAtLocation(token);
        return typeChecker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias);
    }
}

server.addListener(createListener(tsAPI));

server.pages["/"].addInHead(`<title>FullStacked IDE</title>`);
server.pages["/"].addInHead(`<link rel="apple-touch-icon" href="/pwa/app-icons/maskable.png">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-title" content="FullStacked IDE">`);
server.pages["/"].addInHead(`<link rel="apple-touch-startup-image" href="/pwa/app-icons/app-icon.png">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-capable" content="yes">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-status-bar-style" content="#2c2f33">`);

const commandsWS = new WebSocketServer({noServer: true});
let command: IPty;
commandsWS.on('connection', (ws) => {
    command = pty.spawn("/bin/sh", [], {
        name: '',
        cols: 80,
        rows: 30,
        cwd: process.cwd()
    });

    command.onData((data) => ws.send(data))

    ws.on('message', data => {
        const dataStr = data.toString();
        if(dataStr.startsWith("SIZE#")){
            const [_, cols, rows] = dataStr.split("#");
            command.resize(parseInt(cols), parseInt(rows));
            return;
        }else if(dataStr === "##PING##"){
            return;
        }
        command.write(data.toString());
    });

    ws.on('close', () => command.kill());
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
    if(maybePort.toString() === firstDomainPart && maybePort > 2999 && maybePort < 65535){
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
                const originalEnd = res.end.bind(res);
                res.end = function(chunk, encoding?, callback?) {
                    const mimeType = res.getHeader("Content-Type");
                    if (mimeType?.toString()?.startsWith('text/html')) {
                        if(chunk) res.write(chunk, encoding);
                        res.write(`<script src="//cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init({useShadowDom: false});</script>`);
                        return originalEnd(undefined, undefined, callback);
                    }
                    originalEnd(chunk, encoding, callback);
                }
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
        if (maybePort.toString() === firstDomainPart && maybePort > 2999 && maybePort < 65535) {
            return new Promise<void>(resolve => {
                const originalEnd = res.end.bind(res);
                res.end = function(chunk, encoding?, callback?) {
                    const mimeType = res.getHeader("Content-Type");
                    if (mimeType?.toString()?.startsWith('text/html')) {
                        if(chunk) res.write(chunk, encoding);
                        res.write(`<script src="//cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init({useShadowDom: false});</script>`);
                        return originalEnd(undefined, undefined, callback);
                    }
                    originalEnd(chunk, encoding, callback);
                }
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
