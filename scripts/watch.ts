import build, {webAppPostBuild} from "./build";
import fs from "fs";
import run from "./run";
import path from "path";
import {WebSocketServer, WebSocket} from "ws";
import http from "http";

let globalConfig: Config,
    activeClients: Set<WebSocket> = new Set();

function watcher(isWebApp: boolean){
    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       activeClients.forEach(ws => ws.send(Date.now()));
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    // add flags to start node index --development
    fs.writeFileSync(path.resolve(globalConfig.dist, ".env"), "FLAGS=--development");
    return run(globalConfig, false);
}

export default async function(config: Config) {
    globalConfig = config;

    // build with the watcher defined
    await build(config, watcher);

    // start the mini watch server
    const wss = new WebSocketServer({server: http.createServer().listen(8001, "0.0.0.0")});
    wss.on("connection", (ws) => {
        activeClients.add(ws);
        ws.onclose = () => activeClients.delete(ws);
    });

    if(fs.existsSync(path.resolve(config.src, "index.css"))){
        fs.watchFile(path.resolve(config.src, "index.css"), () => webAppPostBuild(config, watcher));
        process.on("SIGINT", () => {
            fs.unwatchFile(path.resolve(config.src, "index.css"));
        });
    }

    await watcher(false);
}
