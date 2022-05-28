import {exec, execSync} from "child_process";
import {execScript} from "./utils";
import path from "path";

// helper to start/restart/attach/stop your app
export default class {
    config: Config;
    lastLogDate: Date = new Date();

    constructor(config: Config) {
        this.config = config
    }

    async start(){
        await execScript(path.resolve(this.config.src, "prerun.ts"), this.config);

        let cmd = `docker-compose -p ${this.config.name} -f ${this.config.out + "/docker-compose.yml"} up -d`;
        if(this.config.silent)
            cmd += " >/dev/null 2>&1";
        execSync(cmd);

        await execScript(path.resolve(this.config.src, "postrun.ts"), this.config);
    }

    restart(){
        let cmd = `docker-compose -p ${this.config.name} -f ${this.config.out + "/docker-compose.yml"} restart -t 0`;
        if(this.config.silent)
            cmd += " >/dev/null 2>&1";
        execSync(cmd)
    }

    // attach to docker-compose
    attach(stdout: typeof process.stdout){
        const dockerProcess = exec(`docker-compose -p ${this.config.name} -f ${this.config.out + "/docker-compose.yml"} logs -f -t`);
        dockerProcess.stdout.on("data", (data) => {
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
        let cmd = `docker-compose -p ${this.config.name} -f ${this.config.out + "/docker-compose.yml"} down -t 0 -v`;
        if(this.config.silent)
            cmd += " >/dev/null 2>&1";
        execSync(cmd);
    }
}
