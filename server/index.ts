import path from "path";
import fs from "fs";
import http, {IncomingMessage, RequestListener, ServerResponse} from "http";
import mime from "mime-types";

class ServerInstance {
    server: http.Server;
    watcher;
    port: number = 80;
    publicDir = path.resolve(__dirname, './public');
    logger: (req: IncomingMessage) => void = null;
    reqListeners = [];

    constructor() {
        if(process.argv.includes("--development")){
            this.logger = (req: IncomingMessage) => {
                console.log(req.method, req.url);
            }
        }

        this.server = http.createServer(async (req, res) => {
            if(this.logger) this.logger(req);

            for (const reqListener of this.reqListeners) {
                // break if response has managed to send
                if(res.headersSent) return;

                const maybePromise = reqListener(req, res);
                if(maybePromise instanceof Promise)
                    await maybePromise;
            }

            // response managed to send
            if(res.headersSent) return;

            // here we bottomed out of request listeners
            res.writeHead(404);
            res.end("Not Found");
        });
    }


    start(){
        // default static file serving
        this.reqListeners.unshift((req, res) => {
            if(res.headersSent) return;

            const url = new URL(this.publicDir + req.url, "http://localhost");
            const filePath = url.pathname + (url.pathname.endsWith("/") ? "index.html" : "");

            if(!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return;

            res.writeHead(200, {"content-type": mime.lookup(filePath)});
            res.end(fs.readFileSync(filePath));
        });

        this.server.listen(this.port);

        if(process.argv.includes("--development")){
            const watcherModule = require("./watcher");
            this.watcher = new watcherModule.default();
            this.watcher.init(this.server);
        }
    }

    promisify(requestListener: RequestListener<typeof IncomingMessage, typeof ServerResponse>): {promisifiedListener(req, res): Promise<void>, resolver(req, res): void}{
        const requestMap = new Map<IncomingMessage, Function>();

        return {
            promisifiedListener: (req, res) => new Promise<void>(resolve => {
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

    addListener(requestListener: RequestListener<typeof IncomingMessage, typeof ServerResponse>, prepend: boolean = false) {
        if(prepend)
            server.reqListeners.unshift(requestListener);
        else
            server.reqListeners.push(requestListener);
    }

    stop(){
        server.server.close()
    }
}

const server = new ServerInstance();

(() => {
    // prevent starting server by import
    // source: https://stackoverflow.com/a/6398335
    if (require.main !== module || process.argv.includes("--prevent-auto-start")) return;

    server.start();
})()

export default server;

