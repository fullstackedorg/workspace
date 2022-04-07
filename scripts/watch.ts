import build from "./build";
import {exec, spawn} from "child_process";
import * as os from "os";

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
    if(watchProcess) {
        if(os.platform() === 'win32' && watchProcess.pid){
            spawn("taskkill", ["/pid", watchProcess.pid, '/f', '/t']);
        }else{
            watchProcess.kill();
        }

    }

    watchProcess = exec("node " + outdir + "/index.js --development");
    watchProcess.stdout.pipe(process.stdout);
    watchProcess.stderr.pipe(process.stderr);
    process.stdin.pipe(watchProcess.stdin);
}

export default async function(config) {
    config.watcher = watcher;
    await build(config);

    outdir = config.out;
    restartServer();
}
