import build from "./build";
import {exec} from "child_process";
import {killProcess} from "./utils";
import fs from "fs";
import Runner from "./runner";

let runner = null, outdir;

function watcher(isWebApp: boolean){
    if(isWebApp) {
       console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
       return;
    }

    console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
    fs.writeFileSync(outdir + "/.env", "FLAGS=--development");
    runner.restart();
    runner.attach(process.stdout);
}

export default async function(config: Config) {
    outdir = config.out;

    // build with the watcher defined
    await build(config, watcher);

    // start the mini watch server
    await killProcess(1, 8001);
    const watcherProcess = exec("node " + config.out + "/watcher.js");
    watcherProcess.stdout.pipe(process.stdout);
    watcherProcess.stderr.pipe(process.stderr);

    fs.writeFileSync(outdir + "/.env", "FLAGS=--development");

    runner = new Runner(config);
    await runner.start();
    runner.attach(process.stdout);

    process.on("SIGINT", () => {
        if(runner)
            runner.stop(true);
    });
}
