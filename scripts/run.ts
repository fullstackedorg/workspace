import Build from "./build";
import Runner from "./runner";
import os from "os";
import readline from "readline";

let runner = null, didSetExitHook = false;

export default async function(config: Config, build: boolean = true){
    if(build)
        await Build(config);

    if(!runner) {
        runner = new Runner(config);
        await runner.start();
    }else{
        runner.restart();
    }

    if(!config.silent)
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
                runner.stop();
            process.exit(0);
        });
        didSetExitHook = true;
    }
}
