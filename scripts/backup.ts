import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import {execSync} from "child_process";
import {execSSH, getSFTPClient, getVolumesToBackup} from "./utils";
import progress from "progress-stream";

export default async function (config: FullStackedConfig) {
    if(config.host)
        return await backupRemote(config);

    if(!fs.existsSync(path.resolve(config.dist, "docker-compose.yml")))
        return console.log("Could not find built docker-compose file");

    const dockerComposeStr = fs.readFileSync(path.resolve(config.dist, "docker-compose.yml"), {encoding: "utf-8"});
    const volumesToBackup = getVolumesToBackup(dockerComposeStr, config.volume);

    for(const volume of volumesToBackup){
        if(!config.silent)
            console.log(`Backing up ${volume} from local host`);

        const commandArr = ["docker", "run",
            "-v", config.name + "_" + volume + ":/data",
            "-v", config.backupDir ?? path.resolve(process.cwd(), "backup") + ":/backup",
            "--name=fullstacked-backup",
            "busybox",
            "tar cvf backup/" + volume + ".tar data"]

        execSync(commandArr.join(" "), {
            stdio: config.silent ? "ignore" : "inherit"
        });

        execSync(`docker rm fullstacked-backup -f -v`);
    }
}

async function backupRemote(config: FullStackedConfig){
    const sftp = await getSFTPClient(config);

    const remoteDockerComposeFilePath = config.appDir + "/" + config.name + "/docker-compose.yml";
    if(!await sftp.exists(remoteDockerComposeFilePath))
        throw new Error("Cannot find docker-compose file in remote host");

    const dockerComposeBuffer = await sftp.get(remoteDockerComposeFilePath);

    const volumes = getVolumesToBackup(dockerComposeBuffer.toString(), config.volume);

    const backupDir = config.backupDir ?? path.resolve(process.cwd(), "backup");
    if(!fs.existsSync(backupDir))
        fs.mkdirSync(backupDir, {recursive: true});

    for(const volume of volumes){
        if(!config.silent)
            console.log(`Backing up ${volume} from remote host`);

        const commandArr = ["docker", "run",
            "-v", config.name + "_" + volume + ":/data",
            "-v", "/tmp/backup:/backup",
            "--name=fullstacked-backup",
            "busybox",
            "tar cvf backup/" + volume + ".tar data"
        ]
        await execSSH(sftp.client, commandArr.join(" "));
        await execSSH(sftp.client, `docker rm fullstacked-backup -f -v`);

        const tarFilePath = `/tmp/backup/${volume}.tar`;

        const outFilePath = path.resolve(backupDir, `${volume}.tar`);
        let dlStream = fs.createWriteStream(outFilePath);

        if(!config.silent){
            const fileStat = await sftp.stat(tarFilePath);

            const progressStream = progress({
                length: fileStat.size
            });

            dlStream = progressStream.pipe(dlStream);
        }

        await sftp.get(`/tmp/backup/${volume}.tar`, dlStream);
    }

    // close connection
    await sftp.end();

    process.exit(0);
}
