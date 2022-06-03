import {ChildProcess, exec, execSync} from "child_process";
import {execScript, isDockerInstalled, silenceCommandLine} from "./utils";
import path from "path";
import fs from "fs";
import yaml from "yaml";

// helper to start/restart/attach/stop your app
export default class {
    config: Config;
    composeFilePath: string;
    attachedProcess: ChildProcess = null;
    lastLogDate: Date = new Date();

    constructor(config: Config) {
        this.config = config;
        this.composeFilePath = path.resolve(this.config.out, "docker-compose.yml")

        if(!isDockerInstalled())
            throw new Error("Cannot run app without Docker and Docker-Compose");
    }

    async start(){
        await execScript(path.resolve(this.config.src, "prerun.ts"), this.config);

        // check if all images are pulled
        const dockerCompose = yaml.parse(fs.readFileSync(this.composeFilePath, {encoding: "utf-8"}))
        const images = Object.values(dockerCompose.services).map(service => (service as any).image);
        const pullNeeded = images.some(image => {
            try{
                execSync(`docker image inspect ${image}`);
                return false;
            }catch (e){
                return true;
            }
        });

        // output the pulling process if needed
        let cmd = `docker-compose -p ${this.config.name} -f ${this.composeFilePath} up -d`;
        if(this.config.silent && !pullNeeded)
            cmd = silenceCommandLine(cmd);
        execSync(cmd, {
            stdio: this.config.silent && !pullNeeded ? "ignore" : "inherit"
        });

        await execScript(path.resolve(this.config.src, "postrun.ts"), this.config);
    }

    restart(){
        let cmd = `docker-compose -p ${this.config.name} -f ${this.composeFilePath} restart -t 0`;
        execSync(cmd, {stdio: this.config.silent ? "ignore" : "inherit"});
    }

    // attach to docker-compose
    attach(stdout: typeof process.stdout){
        if(this.attachedProcess && this.attachedProcess.kill())
            this.attachedProcess.kill();

        this.attachedProcess = exec(`docker-compose -p ${this.config.name} -f ${this.composeFilePath} logs -f -t`);
        this.attachedProcess.stdout.on("data", (data) => {
            // filter out lines already displayed in the past
            let latestDate = this.lastLogDate;
            const lines = data.split("\n").filter(line => {
                const dateMatch = line.match(/\d{4}.*Z/g);
                if(!dateMatch)
                    return true;
                const date = new Date(dateMatch[0]);

                if(date > latestDate)
                    latestDate = date;

                return date > this.lastLogDate;
            });

            stdout.write(lines.join("\n"));

            // keep track of last output log datetime
            this.lastLogDate = latestDate;
        });
    }

    stop(){
        // stop docker-compose and remove all volumes (cleaner)
        let cmd = `docker-compose -p ${this.config.name} -f ${this.composeFilePath} down -t 0 -v`;
        execSync(cmd, {stdio: this.config.silent ? "ignore" : "inherit"});
    }
}
