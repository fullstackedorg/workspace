import build from "./build";
import {exec} from "child_process";
import {killProcess} from "./utils";

let watcherProcess, serverProcess, outdir;

function watcher(isWebApp){
    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    return restartServer();
}

async function restartServer(){
    await killProcess(serverProcess);

    serverProcess = exec("node " + outdir + "/index.js --development");
    serverProcess.stdout.pipe(process.stdout);
    serverProcess.stderr.pipe(process.stderr);
    process.stdin.pipe(serverProcess.stdin);
}

export default async function(config) {
    await build(config, watcher);

    outdir = config.out;
    watcherProcess = exec("node " + outdir + "/watcher.js");
    watcherProcess.stdout.pipe(process.stdout);
    watcherProcess.stderr.pipe(process.stderr);
    return restartServer();
}
