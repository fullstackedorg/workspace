import build from "./build";
import run from "./run";
import {WebSocket} from "ws";
import {execScript} from "./utils";
import path from "path";
import sleep from "./sleep";

let globalConfig: Config,
    ws: WebSocket,
    msgQueue = [];

async function watcher(isWebApp: boolean, first = false){
    if(!first)
        await execScript(path.resolve(globalConfig.src, "postbuild.ts"), globalConfig);

    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       const msg = Date.now();

       if(ws) ws.send(msg);
       else msgQueue.push(msg);

       return;
    }

    if(!first)
        console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    else
        console.log('\x1b[33m%s\x1b[0m', "Watching...")

    const runner = await run(globalConfig, false);

    connectToWatcher(runner.nodePort);
}

function connectToWatcher(port: number){
    ws = new WebSocket(`ws://localhost:${port}/watcher`);
    ws.addListener("open", () => {
        if(!msgQueue.length) return;
        msgQueue.forEach(msg => ws.send(msg));
        msgQueue = [];
    });
    ws.addListener('error', async () => {
        ws = null;
        await sleep(globalConfig.timeout);
        connectToWatcher(port);
    });
}

export default async function(config: Config) {
    globalConfig = config;
    globalConfig.timeout = globalConfig.timeout || 1000;

    // build with the watcher defined
    await build(config, watcher);

    await watcher(false, true);
}
