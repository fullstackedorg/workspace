import {exec, execSync} from "child_process";

export default function(config: Config){
    const dockerProcess = exec(`docker-compose -p ${config.name} -f ${config.out + "/docker-compose.yml"} up`);
    dockerProcess.stdout.pipe(process.stdout);
    dockerProcess.stderr.pipe(process.stderr);

    process.on("SIGINT", () => {
        execSync(`docker-compose -p ${config.name} -f ${config.out + "/docker-compose.yml"} kill`);
        execSync(`docker-compose -p ${config.name} -f ${config.out + "/docker-compose.yml"} down -v`);
    })

}
