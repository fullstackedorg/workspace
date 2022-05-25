import {exec, execSync} from "child_process";
import {execScript} from "./utils";
import path from "path";

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

    attach(stdout: typeof process.stdout){
        const dockerProcess = exec(`docker-compose -p ${this.config.name} -f ${this.config.out + "/docker-compose.yml"} logs -f -t`);
        dockerProcess.stdout.on("data", (data) => {
            const lines = data.split("\n").filter(line => {
                const dateMatch = line.match(/\d{4}.*Z/g);
                if(!dateMatch)
                    return true;
                const date = new Date(dateMatch[0]);
                return date > this.lastLogDate;
            });

            stdout.write(lines.join("\n"));

            lines.forEach(line => {
                const dateMatch = line.match(/\d{4}.*Z/g);
                if(!dateMatch)
                    return true;
                const date = new Date(dateMatch[0]);
                if(date > this.lastLogDate)
                    this.lastLogDate = date;
            });
        });
    }

    stop(volume: boolean = false){
        let cmd = `docker-compose -p ${this.config.name} -f ${this.config.out + "/docker-compose.yml"} down -t 0`;
        if(volume)
            cmd += " -v";
        if(this.config.silent)
            cmd += " >/dev/null 2>&1";
        execSync(cmd);
    }
}
