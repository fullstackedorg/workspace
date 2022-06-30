import config from "../../scripts/config";
import build from "../../scripts/build";
import Runner from "../../scripts/runner";
import {execSync} from "child_process";
import path from "path";
import {cleanOutDir} from "../../scripts/utils";
import waitForServer from "../../scripts/waitForServer";

export default class {
    dir;
    runner;

    constructor(srcDir: string) {
        this.dir = srcDir;
    }

    async start(){
        const localConfig: Config = config({
            name: "test",
            src: this.dir,
            out: this.dir,
            silent: true
        });
        await build(localConfig);
        this.runner = new Runner(localConfig);
        await this.runner.start();
        await waitForServer(3000);
        await execSync(`docker-compose -p ${localConfig.name} -f ${path.resolve(localConfig.dist, "docker-compose.yml")} stop -t 0 node`,
            {stdio: "ignore"});
    }

    async stop(){
        this.runner.stop(true);
        cleanOutDir(this.dir + "/dist")
    }
}
