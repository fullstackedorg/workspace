import Server from '@fullstacked/webapp/server';
import createListener, {createHandler} from "@fullstacked/webapp/rpc/createListener";
import {WebSocketServer} from "ws";
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
import open from "open";
import {platform} from "os";
import {LocalFS} from "./Explorer/local-fs";
import {CloudFS} from "./Explorer/cloud-fs";
import fs from "fs";
import {CloudFSClient} from "./Explorer/cloud-fs-client";

const server = new Server();

if(process.env.NODE_ENV !== 'development' // we're production
    && !process.env.NEUTRALINO // we're not running in neutralino
    && !process.env.NPX_START) // it's not a NPX start
    server.staticFilesCacheControl = "max-age=900";

if(process.env.FULLSTACKED_PORT)
    server.port = parseInt(process.env.FULLSTACKED_PORT);

server.pages["/"].addInHead(`
<link rel="icon" type="image/png" href="/pwa/app-icons/favicon.png">
<link rel="manifest" href="/pwa/manifest.json" crossorigin="use-credentials">
<meta name="theme-color" content="#171f2e"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`);
server.pages["/"].addInHead(`<title>FullStacked</title>`);
server.pages["/"].addInHead(`<link rel="apple-touch-icon" href="/pwa/app-icons/maskable.png">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-title" content="FullStacked">`);
server.pages["/"].addInHead(`<link rel="apple-touch-startup-image" href="/pwa/app-icons/app-icon.png">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-capable" content="yes">`);
server.pages["/"].addInHead(`<meta name="apple-mobile-web-app-status-bar-style" content="#2c2f33">`);

const injectionFileURL = new URL(import.meta.url);
const pathComponents = injectionFileURL.pathname.split("/");
pathComponents.splice(-1, 1, "html", "injection.html");
injectionFileURL.pathname = pathComponents.join("/");
if(fs.existsSync(injectionFileURL)){
    server.pages["/"].addInBody(fs.readFileSync(injectionFileURL).toString());
}

server.addListener({
    prefix: "global",
    handler(req, res) {
        if(req.url !== "/service-worker.js") return;
        res.setHeader("Content-Type", "application/javascript");
        res.end(`self.addEventListener('fetch', (event) => {});`);
    }
}, true);

const WATCH_MODE = process.argv.includes("watch");

if(process.env.FULLSTACKED_ENV === "production" && !WATCH_MODE)
    server.logger = null;

let auth: Auth;
if((process.env.PASS || process.env.AUTH_URL) && !WATCH_MODE)
    auth = initAuth(server);


if(!WATCH_MODE)
    initPortProxy(server);

const terminal = new Terminal();

if(process.env.DOCKER_RUNTIME) {
    initCloudFS()
    initInternalRPC(terminal);
}

// auto shutdown
if(process.env.AUTO_SHUTDOWN){
    const shutdownDelay = parseInt(process.env.AUTO_SHUTDOWN) * 1000;
    let lastActivity = Date.now();
    setInterval(() => {
        if(Date.now() - lastActivity > shutdownDelay)
            process.exit();
    }, 1000);

    server.addListener({
        prefix: "global",
        handler(): any {
            lastActivity = Date.now();
        }
    });

    terminal.onDataListeners.add(() => lastActivity = Date.now());
}

server.start();
console.log(`FullStacked running at http://localhost:${server.port}`);
if(process.env.NPX_START){
    open(`http://localhost:${server.port}`);
}

export default server.serverHTTP;

export const API = {
    ping(){
        return Date.now();
    },
    async portCodeOSS(){
        if(!process.env.CODE_OSS_PORT)
            return null;

        try{
           await fetch(`http://0.0.0.0:${process.env.CODE_OSS_PORT}`);
        }catch (e){
            return null;
        }
        return process.env.CODE_OSS_PORT;
    },
    isInNeutralinoRuntime(){
        return process.env.NEUTRALINO === "1";
    },
    isInDockerRuntime(){
        return process.env.DOCKER_RUNTIME === "1";
    },
    async logout(this: {req: IncomingMessage, res: ServerResponse}){
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

        if(process.env.DOCKER_RUNTIME){
            await LocalFS.sync.bind(this)();
        }

        if(process.env.REVOKE_URL) {
            return fetch(process.env.REVOKE_URL, {
                headers: {
                    cookie: this.req.headers.cookie
                }
            });
        }
    },
    currentDir(){
        let path = process.cwd();

        //windows
        if(platform() === "win32")
            return path.split(":").pop().replace(/\\/g, "/");

        return path;
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
    },
    openBrowserNative(url: string){
        open(url);
    }
}

server.addListener(createListener(API));

server.addListener({
    prefix: "/local-fs",
    handler: createHandler(LocalFS)
});

server.addListener({
    prefix: "/cloud-fs",
    handler: createHandler(CloudFS)
});

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

    if(!WATCH_MODE) {
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


function initAuth(server: Server){
    const auth = new Auth();

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
    });

    return auth;
}


function initPortProxy(server: Server) {
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
    });
}


function initCloudFS(){
    server.addListener({
        name: "CloudFS Init",
        prefix: "global",
        handler(req, res) {
            // sync only once
            if(CloudFSClient.initSyncLaunched) return;
            CloudFSClient.initSyncLaunched = true;

            // since req will be highly modified while waiting for CloudFS.start,
            // we better copy what we need from it
            const copiedCookies = {
                headers: {
                    cookie: req.headers.cookie
                }
            }

            CloudFS.sync.bind({req: copiedCookies})();
        }
    })
}
