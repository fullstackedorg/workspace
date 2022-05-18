import build from "./build";
import {exec} from "child_process";
import {killProcess} from "./utils";

let serverProcess, outdir;

function watcher(isWebApp: boolean){
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
    // build with the watcher defined
    await build(config, watcher);

    outdir = config.out;

    // start the mini watch server
    const watcherProcess = exec("node " + outdir + "/watcher.js");
    watcherProcess.stdout.pipe(process.stdout);
    watcherProcess.stderr.pipe(process.stderr);

    // start app server
    return restartServer();
}
