import Server from '@fullstacked/webapp/server';
import fs from "fs";
import {extname} from "path";
import createListener from "@fullstacked/webapp/rpc/createListener";
import {WebSocketServer} from "ws";
import pty, {IPty} from "node-pty";
import httpProxy from "http-proxy";
import * as fastQueryString from "fast-querystring";
import cookie from "cookie";
import Auth from "./auth";
import {IncomingMessage, ServerResponse} from "http";

export const server = new Server();

server.pages["/"].addInHead(`
<link rel="icon" type="image/png" href="/pwa/app-icons/favicon.png">
<link rel="manifest" href="/pwa/manifest.json" crossorigin="use-credentials">
<meta name="theme-color" content="#171f2e"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`);

let auth: Auth;
if(process.env.PASS || process.env.AUTH_URL){
    auth = new Auth();

    const publicFiles = [
        "/pwa/manifest.json",
        "/pwa/app-icons/favicon.png",
        "/pwa/app-icons/app-icon.png",
        "/pwa/app-icons/maskable.png"
    ];

    server.addListener({
        prefix: "global",
        handler(req, res){
            if(publicFiles.includes(req.url)) return;
            return auth.handler(req, res);
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

export const API = {
    papercupsURL(){
        return process.env.PAPERCUPS_URL;
    },
    async hasCodeServer(){
        try{
           await fetch("http://localhost:8888");
        }catch (e){
            return false
        }
        return true;
    },
    logout(this: {req: IncomingMessage, res: ServerResponse}, refreshToken){
        if(auth){
            auth.invalidateRefreshToken(refreshToken);
        }

        const reqHost = (this.req.headers.origin || this.req.headers.host).replace(/https?:\/\//g, "");
        const reqHostname = reqHost.split(":").shift();
        this.res.setHeader("Set-Cookie", cookie.serialize("fullstackedAccessToken", "", {
            path: "/",
            domain: reqHostname,
            expires: new Date(0)
        }));
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
    }
}

server.addListener(createListener(API));

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

const proxy = httpProxy.createProxy({

});


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

