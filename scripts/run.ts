import Build from "./build";
import Runner from "./runner";

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

    runner.attach(process.stdout);

    // set exit hook only once
    if(!didSetExitHook){
        process.on("SIGINT", () => {
            if(runner)
                runner.stop();
        });
        didSetExitHook = true;
    }
}
