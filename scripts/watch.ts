import build from "./build";
import run from "./run";
import {WebSocket} from "ws";
import waitForServer from "./waitForServer";

let globalConfig: Config,
    ws: WebSocket;

function watcher(isWebApp: boolean){
    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       ws.send(Date.now());
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    run(globalConfig, false).then(() => connectToWatcher());
}

async function connectToWatcher(){
    await waitForServer(3000);
    ws = new WebSocket("ws://localhost:8000/watcher");
}

export default async function(config: Config) {
    globalConfig = config;

    // build with the watcher defined
    await build(config, watcher);

    await watcher(false);
}
