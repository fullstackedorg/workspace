import Server from '@fullstacked/webapp/server';
import createListener, { createHandler } from "@fullstacked/webapp/rpc/createListener";
import { WebSocketServer } from "ws";
import httpProxy from "http-proxy";
import * as fastQueryString from "fast-querystring";
import cookie from "cookie";
import Auth from "./auth";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import Share from "@fullstacked/share";
import randStr from "@fullstacked/cli/utils/randStr"
import { Terminal } from "./terminal";
import { initInternalRPC } from "./internal";
import open from "open";
import { homedir } from "os";
import fs from "fs";
import { RemoteStorageResponseType, Sync } from "./sync";
import { fsCloud } from "./sync/fs-cloud";
import { fsLocal } from "./sync/fs-local";
import path from "path";
import { normalizePath } from './sync/utils';
import { SyncClient } from './sync/client';

const server = new Server();

let auth: Auth;

// when not in watch mode
// watch mode is when developping the workspace
const WATCH_MODE = process.argv.includes("watch");
if (!WATCH_MODE) {
    // and production mode
    if (process.env.FULLSTACKED_ENV === "production") {
        // remove request logger
        server.logger = null;

        // cache static file when not started from the CLI
        if (!process.env.NPX_START)
            server.staticFilesCacheControl = "max-age=900";
    }

    // check for Auth to add
    if (process.env.PASS || process.env.AUTH_URL)
        auth = initAuth(server);

    // set the port defined by main process
    if (process.env.FULLSTACKED_PORT)
        server.port = parseInt(process.env.FULLSTACKED_PORT);

    // init the subdomain proxy listeners
    initPortProxy(server);
}

// HTML Head stuff
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

// try to load the html injection
const injectionFileURL = new URL(import.meta.url);
const pathComponents = injectionFileURL.pathname.split("/");
pathComponents.splice(-1, 1, "html", "injection.html");
injectionFileURL.pathname = pathComponents.join("/");
if (fs.existsSync(injectionFileURL)) {
    server.pages["/"].addInBody(fs.readFileSync(injectionFileURL).toString());
}

// respond dumb service-worker to enable PWA install
server.addListener({
    prefix: "global",
    handler(req, res) {
        if (req.url !== "/service-worker.js") return;
        res.setHeader("Content-Type", "application/javascript");
        res.end(`self.addEventListener('fetch', (event) => {});`);
    }
}, true);

const terminal = new Terminal();

// ATM, only useful for GitHub device flow
// usually host machine will have something for this already
if (process.env.DOCKER_RUNTIME) {
    initInternalRPC(terminal);
}

// start it up!
server.start();
console.log(`FullStacked running at http://localhost:${server.port}`);

// open browser directly from CLI start
if (!process.env.DOCKER_RUNTIME) {
    open(`http://localhost:${server.port}`);
}

// only useful for `fsc watch`
export default server.serverHTTP;


export const API = {
    ping() {
        return Date.now();
    },
    async portCodeOSS() {
        return !!process.env.CODE_OSS_PORT;
    },
    usePort() {
        // check if forced port, or is not in docker
        return process.env.FORCE_PORT_USAGE === "1" || process.env.DOCKER_RUNTIME !== "1";
    },
    async logout(this: { req: IncomingMessage, res: ServerResponse }) {
        const cookies = cookie.parse(this.req.headers.cookie ?? "");

        if (auth) {
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

        if (process.env.REVOKE_URL) {
            return fetch(process.env.REVOKE_URL, {
                headers: {
                    cookie: this.req.headers.cookie
                }
            });
        }
    },
    homeDir() {
        return {
            dir: homedir(),
            sep: path.sep
        }
    },
    currentDir() {
        return normalizePath(Sync.config?.directory || process.cwd());
    },
    share(port: string, password: string) {
        const share = new Share();
        share.config = {
            ...share.config,
            port: parseInt(port),
            password,
            server: process.env.SHARE_SERVER ?? "https://share.fullstacked.cloud"
        }
        activeShare.add(share);
    },
    stopShare(port: string) {
        const share = Array.from(activeShare).find(share => share.config.port.toString() === port);
        share.stop();
        activeShare.delete(share);
    },
    killTerminalSession(SESSION_ID: string) {
        const session = terminal.sessions.get(SESSION_ID);
        if (session) {
            session.pty.kill()
            session.ws.close();
            terminal.sessions.delete(SESSION_ID);
        }
    },
    openBrowserNative(url: string) {
        open(url);
    },
    async initSync(this: { req: IncomingMessage }): Promise<RemoteStorageResponseType> {
        // init status only if null or undefined
        if (!Sync.status)
            Sync.status = {};
        Sync.sendStatus(false);

        // copy this request cookie so we can maybe put the authorization in there
        SyncClient.fs.headers.cookie = this.req.headers.cookie;
        SyncClient.rsync.headers.cookie = this.req.headers.cookie;

        // try to load the configs
        let response = await Sync.loadConfigs();
        if (response) {

            // dont force a user without configs to init sync
            if (typeof response === "object" && response.error === "no_configs") {
                Sync.status = null;
                Sync.sendStatus(false);
            }

            return response;
        }

        // make sure local directory is fine
        response = Sync.directoryCheck();
        if (response)
            return response;

        // try to reach the storage endpoint
        response = await Sync.hello();
        if (response)
            return response;

        if (Sync.config.authorization)
            Sync.setAuthorization(Sync.config.authorization)

        // pull all saved keys
        if (Sync.config.keys?.length) {
            

            Promise.all(Sync.config?.keys.map(key => fsCloud.sync(key)))
                .then(startSyncing);
        }
        else {
            Sync.config.keys = [];
            startSyncing()
        }

        // sync files at the root of /home
        // that starts with .git* 
        // and .profile file
        if (process.env.USE_CLOUD_CONFIG) {
            const dotFiles = await SyncClient.fs.post().readdir(Sync.config.directory, {withFileTypes: true});
            dotFiles.forEach(({name}) => {
                if ( name !== ".profile" && !name.startsWith(".git") )
                    return;

                fsCloud.sync(name, false);
            });
        }

        // in case there's nothing to pull, send the current status
        // to switch from initializing... to something else
        Sync.sendStatus();
        return true;
    },
    getSyncedKeys(): string[] {
        return Sync.config?.keys;
    },
    getSyncDirectory() {
        return Sync.config?.directory;
    },
    getSyncConflicts() {
        return Sync.status?.conflicts;
    },
    dismissSyncError(errorIndex: number) {
        Sync.status.errors.splice(errorIndex, 1);
        Sync.sendStatus();
    },
    sync
}

// register main API
server.addListener(createListener(API));

// register local fs methods
server.addListener({
    prefix: "/fs-local",
    handler: createHandler(fsLocal)
});

// register remote fs methods
server.addListener({
    prefix: "/fs-cloud",
    handler: createHandler(fsCloud)
});

// Port sharing
// currently downed
// will come back at it soon
const shareWSS = new WebSocketServer({ noServer: true });
const activeShare = new Set<Share>();
shareWSS.on('connection', (ws, req) => {
    const { port } = fastQueryString.parse(req.url.split("?").pop());
    const share = Array.from(activeShare).find(share => share.config.port.toString() === port);
    if (!share) {
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
                ws.send(JSON.stringify({ url: shareEvent.url }));
                return;
            case "password":
                const id = randStr();
                awaitingPasswords.set(id, shareEvent.callback)
                ws.send(JSON.stringify({ id, password: true }));
                return;
            case "login":
                ws.send(JSON.stringify({ login: shareEvent.url }));
                return;
            case "end":
                activeShare.delete(share);
                ws.send(JSON.stringify({ end: true }));
                return;
        }
    });

    share.run();
});

const subdomainPortProxy = httpProxy.createProxy();

subdomainPortProxy.on('proxyRes', function (proxyRes, req, res) {
    // remove those headers that block iframe display
    delete proxyRes.headers["content-security-policy"];
    delete proxyRes.headers["x-frame-options"];
});

// proxy websockets
server.serverHTTP.on('upgrade', (req: IncomingMessage, socket: Socket, head) => {
    // auth
    if (auth && !auth.isRequestAuthenticated(req)) {
        socket.end();
        return;
    }

    // a url will look like : https://8080.fullstacked.cloud
    // grab the first part [8080]
    // and reverse proxy there
    if (!WATCH_MODE) {
        const domainParts = req.headers.host.split(".");
        const firstDomainPart = domainParts.shift();
        const maybePort = parseInt(firstDomainPart);
        // only allow from 3000 to max possible port (8-bytes) (65535)
        if (maybePort.toString() === firstDomainPart && maybePort >= 3000 && maybePort <= 65535) {
            return new Promise(resolve => {
                subdomainPortProxy.ws(req, socket, head, { target: `http://0.0.0.0:${firstDomainPart}` }, resolve);
            });
        }
    }

    // check for other websocket servers
    if (req.url.startsWith("/fullstacked-terminal")) {
        terminal.webSocketServer.handleUpgrade(req, socket, head, (ws) => {
            terminal.webSocketServer.emit('connection', ws, req);
        });
    } else if (req.url.startsWith("/oss-dev")) {
        proxyCodeOSS.ws(req, socket, head);
    } else if (req.url.startsWith("/fullstacked-sync")) {
        Sync.webSocketServer.handleUpgrade(req, socket, head, (ws) => {
            Sync.webSocketServer.emit('connection', ws);
        });
    } else if (req.url.split("?").shift() === "/fullstacked-share") {
        shareWSS.handleUpgrade(req, socket, head, (ws) => {
            shareWSS.emit('connection', ws, req);
        });
    }
});


function initAuth(server: Server) {
    const auth = new Auth();

    const publicFiles = [
        "/pwa/manifest.json",
        "/pwa/app-icons/favicon.png",
        "/pwa/app-icons/app-icon.png",
        "/pwa/app-icons/maskable.png"
    ];

    server.addListener({
        prefix: "global",
        handler(req, res) {
            if (publicFiles.includes(req.url)) return;
            return auth.handler(req, res);
        }
    });

    return auth;
}

// a url will look like : https://8080.fullstacked.cloud
// grab the first part [8080]
// and reverse proxy there
function initPortProxy(server: Server) {
    server.addListener({
        prefix: "global",
        handler(req, res) {
            const domainParts = req.headers.host.split(".");
            const firstDomainPart = domainParts.shift();
            const maybePort = parseInt(firstDomainPart);
            if (maybePort.toString() === firstDomainPart && maybePort >= 3000 && maybePort <= 65535) {
                return new Promise<void>(resolve => {
                    subdomainPortProxy.web(req, res, { target: `http://0.0.0.0:${firstDomainPart}` }, () => {
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

let addedSyncingListener = false;
function startSyncing() {
    // really add only once!
    if (addedSyncingListener)
        return;
    addedSyncingListener = true;


    server.addListener({
        prefix: "global",
        handler(req, res): any {
            if (req.url.startsWith("/oss-dev")) return;

            if (Date.now() - Sync.status.lastSync <= Sync.syncInterval) return;

            sync();
        }
    });
}

async function sync() {
    // sync files at the root of /home
    // that starts with .git* 
    // and .profile file
    if (process.env.USE_CLOUD_CONFIG) {
        const dotFiles = fs.readdirSync(Sync.config.directory)
            .filter(file => {
                if ( file !== ".profile" && !file.startsWith(".git") )
                    return;

                fsLocal.sync(file, false);
            });
    }

    if (!Sync.config?.keys?.length) {
        Sync.sendStatus();
        return;
    }

    Sync.config?.keys.forEach(key => fsLocal.sync(key))
}

// reverse proxy code OSS
//
// I used to simply display it in an iframe and it was working great!
// But on iPad Pro, scrolling in iframes is very shitty,
// so scrolling in the code editor wasnt working -.-
// Managed to sort of hack a way to lazy load Code OSS on premise within the main window
// by reverse proxying and merging it's html response to main app HTML
const proxyCodeOSS = httpProxy.createProxy({
    target: `http://0.0.0.0:${process.env.CODE_OSS_PORT}`
})
server.addListener({
    prefix: "/oss-dev",
    handler(req: IncomingMessage, res: ServerResponse): any {
        if (req.url)
            req.url = "/oss-dev" + req.url;
        return new Promise(resolve => {
            proxyCodeOSS.web(req, res, undefined, resolve)
        });
    }
});

// throws on windows...
proxyCodeOSS.removeAllListeners("error");
