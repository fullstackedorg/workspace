import fs from "fs";
import http, {IncomingMessage, RequestListener, ServerResponse} from "http";
import mime from "mime";
import HTML from "./HTML";
import {resolve} from "path";
import {fileURLToPath} from "url";

export type Listener = {
    name?: string,
    handler(req: IncomingMessage, res: ServerResponse): any | Promise<any>,
}

function getPort(){
    const port = parseInt(process.env.PORT);
    return port && !isNaN(port) ? port : 8000;
}

export default class {
    serverHTTP: http.Server;
    port: number = getPort();
    /* default file structure if
    *  dist
    *  |_ client
    *  |  |_ index.js
    *  |_ server
    *  |  |_ index.mjs
    *  |_ docker-compose.yml
    */
    publicDir = process.env.CLIENT_DIR
        ? resolve(process.cwd(), process.env.CLIENT_DIR)
        : fileURLToPath(new URL("../client", import.meta.url));
    logger: {
        in(req, res): void,
        out(req, res): void
    } = null;

    listeners: {[url: string]: Listener[]} = {
        default: [
            {
                name: "Default Public File Serving",
                handler: this.staticFilesAndPagesHandler.bind(this)
            },{
                name: "Not Found",
                handler(req: IncomingMessage, res: ServerResponse): any {
                    res.writeHead(404);
                    res.end("Not Found");
                }
            }
        ]
    };

    pages: {[url: string]: HTML} = {
        ["/"]: new HTML()
    };

    constructor() {
        if(process.env.NODE_ENV === "development"){
            const activeRequests = new Map();
            this.logger = {
                in(req, res){
                    activeRequests.set(res, Date.now());
                    console.log(req.method, req.url);
                },
                out(req, res){
                    const start = activeRequests.get(res) ?? 0;
                    if(start) activeRequests.delete(res);
                    console.log(req.method, req.url, `[${res.currentListener}]`, res.statusCode, (Date.now() - start) + "ms");
                }
            }
        }

        if(fs.existsSync(resolve(this.publicDir, "index.css")))
            this.pages["/"].addStyle("/index.css");

        if(fs.existsSync(resolve(this.publicDir, "index.js")))
            this.pages["/"].addScript("/index.js");

        this.serverHTTP = http.createServer(async (req, res: ServerResponse & {currentListener: string}) => {
            if(this.logger?.in) this.logger.in(req, res);

            const urlPrefixes = Object.keys(this.listeners);
            const listenersKey = urlPrefixes.find(prefix => req.url.startsWith(prefix)) ?? "default";

            if(listenersKey !== "default")
                req.url = req.url.slice(listenersKey.length);

            if(req.url === "")
                req.url = "/";

            for (const listener of this.listeners[listenersKey]) {
                // break if response has managed to send
                if(res.headersSent) break;

                res.currentListener = listener.name;

                const maybePromise = listener.handler(req, res);
                if(maybePromise instanceof Promise) {
                    await maybePromise;
                }
            }

            if(this.logger?.out) this.logger.out(req, res);
        });
    }

    addListener(listener: Listener & {prefix?: string}, prepend = false){
        const urlPrefix = listener.prefix || "default";

        if(!this.listeners[urlPrefix]) this.listeners[urlPrefix] = [];

        if(prepend)
            this.listeners[urlPrefix].unshift(listener);
        else
            this.listeners[urlPrefix].push(listener);
    }

    staticFilesAndPagesHandler(req, res: ServerResponse) {
        // remove query params
        let fileURL = req.url.split("?").shift();

        // remove /index.html
        if(fileURL.endsWith("/index.html"))
            fileURL = fileURL.slice(0, -("/index.html".length));

        // if nothing left, we're at root "/"
        if(fileURL === "")
            fileURL = "/";

        if (this.pages[fileURL]) {
            res.setHeader("content-type", "text/html")
            res.writeHead(200);
            res.end(this.pages[fileURL].toString());
            return;
        }

        // remove leading slash : /asset/image.png => asset/image.png
        const filePath = resolve(this.publicDir, fileURL.slice(1));

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return;

        res.setHeader("content-type", mime.getType(filePath));
        res.writeHead(200);
        res.end(fs.readFileSync(filePath));
    }

    start(){
        this.serverHTTP.listen(this.port);
    }

    promisify(requestListener: RequestListener<typeof IncomingMessage, typeof ServerResponse>): {handler(req, res): Promise<void>, resolver(req, res): void}{
        const requestMap = new Map<IncomingMessage, Function>();

        return {
            handler: (req, res) => new Promise<void>(resolve => {
                requestMap.set(req, resolve);
                requestListener(req, res);
            }),
            resolver: (req, res) => {
                // resolve promise
                requestMap.get(req)();

                // cleanup
                requestMap.delete(req);
            }
        }
    }

    stop(){
        return new Promise(resolve => {
            this.serverHTTP.close(resolve)
        });
    }
}
