import fs from "fs";
import http, {IncomingMessage, RequestListener, ServerResponse} from "http";
import mime from "mime";
import HTML from "./HTML";
import {resolve} from "path";

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
    clientDir = process.env.CLIENT_DIR
        ? resolve(process.cwd(), process.env.CLIENT_DIR)
        : resolve(process.cwd(), "client");
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
        if(process.env.NODE_ENV !== "production"){
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

        if(fs.existsSync(resolve(this.clientDir, "index.css")))
            this.pages["/"].addStyle("/index.css");

        if(fs.existsSync(resolve(this.clientDir, "index.js")))
            this.pages["/"].addScript("/index.js");

        this.serverHTTP = http.createServer(async (req, res: ServerResponse & {currentListener: string}) => {
            if(this.logger?.in) this.logger.in(req, res);

            const urlPrefixes = Object.keys(this.listeners);
            let listenerKeys: string[] = urlPrefixes.filter(prefix => req.url.startsWith(prefix));
            if(!listenerKeys.length)
                listenerKeys = ["default"];

            if(this.listeners["global"])
                listenerKeys.unshift("global");

            const originalUrl = req.url;
            for (const listenerKey of listenerKeys) {
                const listeners = this.listeners[listenerKey];

                req.url = listenerKey !== "default" && listenerKey !== "global"
                    ? originalUrl.slice(listenerKey.length)
                    : originalUrl;

                for (const listener of listeners){
                    // break if response has managed to send
                    if(res.headersSent) break;

                    res.currentListener = listener.name;

                    const maybePromise = listener.handler(req, res);
                    if(maybePromise instanceof Promise) {
                        await maybePromise;
                    }
                }

                // break if response has managed to send
                if(res.headersSent) break;
            }

            if(this.logger?.out) this.logger.out(req, res);
        });
    }

    addListener(listener: Listener & {prefix?: "global" | "default" | string}, prepend = false){
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
        const filePath = resolve(this.clientDir, fileURL.slice(1));

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
