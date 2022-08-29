import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import {execSync} from "child_process";
import SFTP from "ssh2-sftp-client";
import {execSSH} from "./utils";

export default async function (config: FullStackedConfig) {
    if(config.host)
        return await backupRemote(config);

    if(!fs.existsSync(path.resolve(config.dist, "docker-compose.yml")))
        return console.log("Could not find built docker-compose file");

    const dockerCompose = yaml.parse(fs.readFileSync(path.resolve(config.dist, "docker-compose.yml"), {encoding: "utf-8"}));
    const volumes = Object.keys(dockerCompose.volumes);

    if(!config.volume || !volumes.includes(config.volume))
        return console.log("Volume not found in current docker-compose running");

    execSync(`docker run -v ${config.name + "_" + config.volume}:/data -v ${config.backupDir ?? config.dist}/backup:/backup --name=fullstacked-backup busybox tar cvf backup/${config.volume}.tar data`, {
        stdio: config.silent ? "ignore" : "inherit"
    });

    execSync(`docker rm fullstacked-backup -f -v`);
}

async function backupRemote(config: FullStackedConfig){
    const sftp = new SFTP();

    // setup ssh connection
    let connectionConfig: any = {
        host: config.host,
        username: config.user
    }

    if(config.sshPort)
        connectionConfig.port = config.sshPort;

    if(config.pass)
        connectionConfig.password = config.pass;

    if(config.privateKey)
        connectionConfig.privateKey = fs.readFileSync(path.resolve(process.cwd(), config.privateKey));

    await sftp.connect(connectionConfig);

    await execSSH(sftp.client, `docker run -v ${config.name + "_" + config.volume}:/data -v /tmp/backup:/backup --name=fullstacked-backup busybox tar cvf backup/${config.volume}.tar data`);
    await execSSH(sftp.client, `docker rm fullstacked-backup -f -v`);

    const backupDir = path.resolve(config.backupDir ?? process.cwd(), "backup");
    if(!fs.existsSync(backupDir))
        fs.mkdirSync(backupDir, {recursive: true});

    await sftp.get(`/tmp/backup/${config.volume}.tar`, path.resolve(backupDir, `${config.volume}.tar`));

    // close connection
    await sftp.end();

    process.exit(0);
}
