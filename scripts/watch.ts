import build from "./build";
import run from "./run";
import {WebSocket} from "ws";
import waitForServer from "./waitForServer";
import {execScript} from "./utils";
import path from "path";

let globalConfig: Config,
    ws: WebSocket,
    runningPort;

async function watcher(isWebApp: boolean){
    await execScript(path.resolve(globalConfig.src, "postbuild.ts"), globalConfig);

    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       ws.send(Date.now());
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    const definedPort = await run(globalConfig, false);

    if(typeof definedPort === "number") {
        runningPort = definedPort;
        console.log("App running at http://localhost:" + runningPort);
    }

    await connectToWatcher(runningPort);
}

async function connectToWatcher(port: number){
    await waitForServer(globalConfig.timeout || 3000);
    ws = new WebSocket(`ws://localhost:${port}/watcher`);
}

export default async function(config: Config) {
    globalConfig = config;

    // build with the watcher defined
    await build(config, watcher);

    await watcher(false);
}
