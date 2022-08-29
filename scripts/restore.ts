import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import {execSync} from "child_process";
import {silenceCommandLine} from "./utils";
import SFTP from "ssh2-sftp-client";
import {execSSH} from "./utils";

export default async function (config: FullStackedConfig) {
    if(config.host)
        return await restoreRemote(config);

    const dockerComposeFile = path.resolve(config.dist, "docker-compose.yml");

    if(!fs.existsSync(dockerComposeFile))
        return console.log("Could not find built docker-compose file");

    const dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFile, {encoding: "utf-8"}));
    const volumes = Object.keys(dockerCompose.volumes);

    if(!config.volume || !volumes.includes(config.volume))
        return console.log("Volume not found in current docker-compose running");

    const stopCommand = `docker-compose -p ${config.name} -f ${dockerComposeFile} stop -t 0`;
    execSync(config.silent ? silenceCommandLine(stopCommand) : stopCommand);

    execSync(`docker run -v ${config.name + "_" + config.volume}:/data -v ${config.backupDir ?? config.dist}/backup:/backup --name=fullstacked-restore busybox sh -c "cd data && rm -rf ./* && tar xvf /backup/${config.volume}.tar --strip 1"`, {
        stdio: config.silent ? "ignore" : "inherit"
    });

    execSync(`docker rm fullstacked-restore -f -v`);

    const upCommand = `docker-compose -p ${config.name} -f ${dockerComposeFile} start`;
    execSync(config.silent ? silenceCommandLine(upCommand) : upCommand);
}

async function restoreRemote(config: FullStackedConfig){
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

    const dockerComposeRemoteFile = config.appDir + "/" + config.name + "/docker-compose.yml";

    if(!await sftp.exists(dockerComposeRemoteFile))
        throw Error("Cannot find docker compose file in remote host");

    await sftp.mkdir(`/tmp/backup`, true);

    const backupFile = path.resolve(config.backupDir ?? process.cwd(), "backup", `${config.volume}.tar`);
    if(!fs.existsSync(backupFile))
        throw Error("Cannot find backup file");

    await sftp.put(backupFile, `/tmp/backup/${config.volume}.tar`);

    await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${dockerComposeRemoteFile} stop -t 0`);
    await execSSH(sftp.client, `docker run -v ${config.name + "_" + config.volume}:/data -v /tmp/backup:/backup --name=fullstacked-restore busybox sh -c "cd data && rm -rf ./* && tar xvf /backup/${config.volume}.tar --strip 1"`);
    await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${dockerComposeRemoteFile} start`);
    await execSSH(sftp.client, `docker rm fullstacked-restore -f -v`);

    // close connection
    await sftp.end();

    process.exit(0);
}
