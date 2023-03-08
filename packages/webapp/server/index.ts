import fs from "fs";
import http, {IncomingMessage, RequestListener, ServerResponse} from "http";
import mime from "mime";
import HTML from "./HTML";
import {resolve} from "path";
import {fileURLToPath} from "url";

type Listener = {
    name?: string,
    handler(req: IncomingMessage, res: ServerResponse): any | Promise<any>,
}

class ServerInstance {
    server: http.Server;
    port: number = 80;
    publicDir = fileURLToPath(new URL("./public", import.meta.url));
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
        if(process.argv.includes("--development") || process.argv.includes("--gui")){
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
            this.pages["/"].addInHead(`<link rel="stylesheet" href="/index.css">`);

        this.server = http.createServer(async (req, res: ServerResponse & {currentListener: string}) => {
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

    addListener(urlPrefix: string, listener: Listener, prepend = false){
        if(!this.listeners[urlPrefix]) this.listeners[urlPrefix] = [];

        if(prepend)
            this.listeners[urlPrefix].unshift(listener);
        else
            this.listeners[urlPrefix].push(listener);
    }

    staticFilesAndPagesHandler(req, res) {
        // remove query params
        let fileURL = req.url.split("?").shift();

        // remove /index.html
        if(fileURL.endsWith("/index.html"))
        fileURL = fileURL.slice(0, -("/index.html".length));

        // if nothing left, we're at root "/"
        if(fileURL === "")
        fileURL = "/";

        if (this.pages[fileURL]) {
            res.writeHead(200, {"content-type": "text/html"});
            res.end(this.pages[fileURL].toString());
            return;
        }

        // remove leading slash : /asset/image.png => asset/image.png
        const filePath = resolve(this.publicDir, fileURL.slice(1));

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return;

        res.writeHead(200, {"content-type": mime.getType(filePath)});
        res.end(fs.readFileSync(filePath));
    }

    start(){
        this.server.listen(this.port);
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
        Server.server.close()
    }
}

const Server = new ServerInstance();

export default Server;

