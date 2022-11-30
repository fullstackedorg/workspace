import Build from "./build";
import Runner from "./runner";
import os from "os";
import readline from "readline";
import restore from "./restore";

let runner: Runner = null, didSetExitHook = false;

export default async function(config: Config, build: boolean = true){
    if(build)
        await Build(config);

    if(!runner) {
        runner = new Runner(config);
        await runner.start();
        console.log("Web App Running at http://localhost:" + runner.nodePort);

        if(config.restored)
            await restore(config);
    }else{
        runner.restart();
    }

    runner.attach(process.stdout);

    // set exit hook only once
    if(!didSetExitHook){

        if(os.platform() === "win32"){
            //source : https://stackoverflow.com/a/48837698
            readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            }).on('close', function() {
                process.emit('SIGINT')
            })
        }

        process.on("SIGINT", () => {
            if(!config.silent)
                console.log('\x1b[33m%s\x1b[0m', "Stopping!");

            if(runner)
                runner.stop().then(() => process.exit(0));
        });
        didSetExitHook = true;
    }

    return runner;
}
