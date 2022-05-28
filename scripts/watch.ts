import build from "./build";
import {exec} from "child_process";
import {killProcess} from "./utils";
import fs from "fs";
import run from "./run";

let globalConfig: Config;

function watcher(isWebApp: boolean){
    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    // add flags to start node index --development
    fs.writeFileSync(globalConfig.out + "/.env", "FLAGS=--development");
    return run(globalConfig, false);
}

export default async function(config: Config) {
    globalConfig = config;

    // build with the watcher defined
    await build(config, watcher);

    // start the mini watch server
    await killProcess(1, 8001);
    const watcherProcess = exec("node " + globalConfig.out + "/watcher.js");
    watcherProcess.stdout.pipe(process.stdout);
    watcherProcess.stderr.pipe(process.stderr);

    await watcher(false);
}
