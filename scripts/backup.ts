import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import {execSync} from "child_process";

export default function (config: FullStackedConfig) {
    if(!fs.existsSync(path.resolve(config.dist, "docker-compose.yml")))
        return console.log("Could not find built docker-compose file");

    const dockerCompose = yaml.parse(fs.readFileSync(path.resolve(config.dist, "docker-compose.yml"), {encoding: "utf-8"}));
    const volumes = Object.keys(dockerCompose.volumes);

    if(!config.volume || !volumes.includes(config.volume))
        return console.log("Volume not found in current docker-compose running");

    execSync(`docker run -v ${config.name + "_" + config.volume}:/data -v ${config.backupDir ?? config.dist}/backup:/backup --name=fullstacked-backup busybox tar cvf backup/${config.volume}.tar data`, {
        stdio: config.silent ? "ignore" : "inherit"
    });

    execSync(`docker rm fullstacked-backup -f`);
}
