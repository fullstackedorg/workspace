import Server from '@fullstacked/webapp/server';
import fs from "fs";
import {extname} from "path";
import createListener from "@fullstacked/webapp/rpc/createListener";
import {WebSocket, WebSocketServer} from "ws";
import pty, {IPty} from "node-pty";
import httpProxy from "http-proxy";
import * as fastQueryString from "fast-querystring";
import cookie from "cookie";
import Auth from "./auth";
import {IncomingMessage, ServerResponse} from "http";
import {Socket} from "net";
import Share from "@fullstacked/share";
import randStr from "@fullstacked/cli/utils/randStr"
import {Terminal} from "./terminal";
import {initInternalRPC} from "./internal";

const server = new Server();

const terminal = new Terminal();

if(process.env.FULLSTACKED_ENV === "production")
    server.logger = null;

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

server.start();

export default server.serverHTTP;

export const API = {
    ping(){
        return (Math.random() * 100000).toFixed(0);
    },
    papercups(){
        return {
            accountId: process.env.PAPERCUPS_ACCOUNT_ID,
            publicKey: process.env.PAPERCUPS_PUBLIC_KEY,
            token: process.env.PAPERCUPS_TOKEN,
            inbox: process.env.PAPERCUPS_INBOX,
            baseUrl: process.env.PAPERCUPS_BASE_URL
        };
    },
    async hasCodeOSS(){
        try{
           await fetch("http://0.0.0.0:8888");
        }catch (e){
            return false
        }
        return true;
    },
    logout(this: {req: IncomingMessage, res: ServerResponse}){
        const cookies = cookie.parse(this.req.headers.cookie ?? "");

        if(auth){
            auth.invalidateRefreshToken(cookies.fullstackedRefreshToken);
        }

        const reqHost = (this.req.headers.origin || this.req.headers.host).replace(/https?:\/\//g, "");
        const reqHostname = reqHost.split(":").shift();
        this.res.setHeader("Set-Cookie", [
            cookie.serialize("fullstackedAccessToken", "", {
                path: "/",
                domain: reqHostname,
                expires: new Date(0)
            }),
            cookie.serialize("fullstackedRefreshToken", "", {
                path: "/",
                domain: reqHostname,
                httpOnly: true,
                expires: new Date(0)
            })
        ]);
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
    },
    share(port: string, password: string){
        const share = new Share();
        share.config = {
            ...share.config,
            port: parseInt(port),
            password,
            server: process.env.SHARE_SERVER ?? "https://share.fullstacked.cloud"
        }
        activeShare.add(share);
    },
    stopShare(port: string){
        const share = Array.from(activeShare).find(share => share.config.port.toString() === port);
        share.stop();
        activeShare.delete(share);
    },
    killTerminalSession(SESSION_ID: string){
        const session = terminal.sessions.get(SESSION_ID);
        if(session){
            session.pty.kill()
            session.ws.close();
            terminal.sessions.delete(SESSION_ID);
        }
    }
}

server.addListener(createListener(API));

server.pages["/"].addInHead(`<title>FullStacked</title>`);
server.pages["/"].addInHead(`<link rel="apple-touch-icon" href="/pwa/app-icons/maskable.png">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-title" content="FullStacked">`);
server.pages["/"].addInHead(`<link rel="apple-touch-startup-image" href="/pwa/app-icons/app-icon.png">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-capable" content="yes">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-status-bar-style" content="#2c2f33">`);

const shareWSS = new WebSocketServer({noServer: true});
const activeShare = new Set<Share>();
shareWSS.on('connection', (ws, req) => {
    const {port} = fastQueryString.parse(req.url.split("?").pop());
    const share = Array.from(activeShare).find(share => share.config.port.toString() === port);
    if(!share) {
        ws.close();
        return;
    }

    ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        const awaitingPass = awaitingPasswords.get(data.id);
        awaitingPass(data.password);
        awaitingPasswords.delete(data.id);
    });

    const awaitingPasswords = new Map();
    share.listeners.add(shareEvent => {
        switch (shareEvent.type) {
            case "url":
                ws.send(JSON.stringify({url: shareEvent.url}));
                return;
            case "password":
                const id = randStr();
                awaitingPasswords.set(id, shareEvent.callback)
                ws.send(JSON.stringify({id, password: true}));
                return;
            case "login":
                ws.send(JSON.stringify({login: shareEvent.url}));
                return;
            case "end":
                activeShare.delete(share);
                ws.send(JSON.stringify({end: true}));
                return;
        }
    });

    share.run();
});

const proxy = httpProxy.createProxy();

proxy.on('proxyRes', function (proxyRes, req, res) {
    delete proxyRes.headers["content-security-policy"];
    delete proxyRes.headers["x-frame-options"];
});

server.serverHTTP.on('upgrade', (req: IncomingMessage, socket: Socket, head) => {
    if(auth && !auth.isRequestAuthenticated(req)){
        socket.end();
        return;
    }

    const cookies = cookie.parse(req.headers.cookie ?? "");

    if(cookies.port){
        return new Promise(resolve => {
            proxy.ws(req, socket, head, {target: `http://0.0.0.0:${cookies.port}`}, resolve);
        })
    }

    const domainParts = req.headers.host.split(".");
    const firstDomainPart = domainParts.shift();
    const maybePort = parseInt(firstDomainPart);
    if(maybePort.toString() === firstDomainPart && maybePort > 2999 && maybePort < 65535){
        return new Promise(resolve => {
            proxy.ws(req, socket, head, {target: `http://0.0.0.0:${firstDomainPart}`}, resolve);
        });
    }

    if(req.url.startsWith("/fullstacked-terminal")){
        terminal.webSocketServer.handleUpgrade(req, socket, head, (ws) => {
            terminal.webSocketServer.emit('connection', ws, req);
        });
    }else if(req.url.split("?").shift() === "/fullstacked-share"){
        shareWSS.handleUpgrade(req, socket, head, (ws) => {
            shareWSS.emit('connection', ws, req);
        });
    }


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
                proxy.web(req, res, {target: `http://0.0.0.0:${cookies.port}`}, () => {
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
                proxy.web(req, res, {target: `http://0.0.0.0:${firstDomainPart}`}, () => {
                    if (!res.headersSent) {
                        res.end(`Port ${firstDomainPart} is down.`);
                    }
                    resolve();
                });
            })
        }
    }
})

initInternalRPC(terminal);
