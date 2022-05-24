import Build from "./build";
import Runner from "./runner";

let runner = null, didSetExitHook = false;

export default async function(config: Config, build: boolean = true){
    if(build)
        await Build(config);

    if(!runner) {
        runner = new Runner(config);
        runner.start();
    }else{
        runner.restart();
    }

    runner.attach(process.stdout);

    if(!didSetExitHook){
        process.on("SIGINT", () => {
            if(runner)
                runner.stop();
        });
        didSetExitHook = true;
    }
}
