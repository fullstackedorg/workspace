import build from "./build";
import {exec} from "child_process";
import {killProcess} from "./utils";

let watchProcess, outdir;

function watcher(isWebApp){
    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    return restartServer();
}

async function restartServer(){
    await killProcess(watchProcess, 8000);

    watchProcess = exec("node " + outdir + "/index.js --development");
    watchProcess.stdout.pipe(process.stdout);
    watchProcess.stderr.pipe(process.stderr);
    process.stdin.pipe(watchProcess.stdin);
}

export default async function(config) {
    config.watcher = watcher;
    await build(config);

    outdir = config.out;
    return restartServer();
}
