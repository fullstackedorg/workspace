import fs from "fs";
import http, {IncomingMessage, RequestListener, ServerResponse} from "http";
import mime from "mime";
import HTML from "./HTML";

class ServerInstance {
    server: http.Server;
    port: number = 80;
    publicDir = "./public";
    logger: {
        in(req, res): void,
        out(req, res): void
    } = null;
    listeners: {
        name?: string,
        handler(req: IncomingMessage, res: ServerResponse): any | Promise<any>,
    }[] = [];
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

        this.server = http.createServer(async (req, res: ServerResponse & {currentListener: string}) => {
            if(this.logger?.in) this.logger.in(req, res);

            for (const listener of this.listeners) {
                // break if response has managed to send
                if(res.headersSent) break;

                res.currentListener = listener.name;

                const maybePromise = listener.handler(req, res);
                if(maybePromise instanceof Promise) {
                    await maybePromise;
                }
            }

            if(!res.headersSent){
                res.statusCode = 404;

                res.currentListener = "Bottomed Out";
                res.writeHead(res.statusCode);
                res.end("Not Found");
            }

            if(this.logger?.out) this.logger.out(req, res);
        });
    }

    start(){
        // default static file serving in front
        this.listeners.unshift({
            name: "Default Public File Serving",
            handler: (req, res) => {
                if (res.headersSent) return;

                const fileURL = req.url.split("?").shift();

                if (this.pages[fileURL]) {
                    res.writeHead(200, {"content-type": "text/html"});
                    res.end(this.pages[fileURL].toString());
                    return;
                }

                const filePath = this.publicDir + fileURL;

                if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return;

                res.writeHead(200, {"content-type": mime.getType(filePath)});
                res.end(fs.readFileSync(filePath));
            }
        });

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

Server.start();

export default Server;

