import build from "./build";
import child_process from "child_process";

let watchProcess, outdir;

function watcher(isWebApp){
    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    restartServer();
}

function restartServer(){
    if(watchProcess?.kill)
        watchProcess.kill();
    watchProcess = child_process.exec("node " + outdir + "/index.js");
}

export default async function(config) {
    config.watcher = watcher;
    await build(config);

    outdir = config.out;
    restartServer();
}
