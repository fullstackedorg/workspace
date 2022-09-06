import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import {execSync} from "child_process";
import {clearLine, getSFTPClient, getVolumesToBackup, printLine, silenceCommandLine} from "./utils";
import {execSSH} from "./utils";
import progress from "progress-stream";

export default async function (config: FullStackedConfig) {
    if(config.host)
        return await restoreRemote(config);

    const dockerComposeFile = path.resolve(config.dist, "docker-compose.yml");
    const volumesToRestore = getVolumesToBackup(fs.readFileSync(dockerComposeFile, {encoding: "utf-8"}), config.volume);

    const stopCommand = `docker-compose -p ${config.name} -f ${dockerComposeFile} stop -t 0`;
    execSync(config.silent ? silenceCommandLine(stopCommand) : stopCommand);

    for(const volume of volumesToRestore){
        if(!config.silent)
            console.log(`Restoring ${volume} on local host`);

        const commandArr = [
            "docker", "run",
            "-v", config.name + "_" + volume + ":/data",
            "-v", config.backupDir ?? path.resolve(process.cwd(), "backup") + ":/backup",
            "--name=fullstacked-restore busybox",
            "sh -c \"cd data && rm -rf ./* && tar xvf /backup/" + volume + ".tar --strip 1\""
        ];

        execSync(commandArr.join(" "), {
            stdio: config.silent ? "ignore" : "inherit"
        });

        execSync(`docker rm fullstacked-restore -f -v`);
    }

    const upCommand = `docker-compose -p ${config.name} -f ${dockerComposeFile} start`;
    execSync(config.silent ? silenceCommandLine(upCommand) : upCommand);
}

async function restoreRemote(config: FullStackedConfig){
    const sftp = await getSFTPClient(config);

    const dockerComposeRemoteFile = config.appDir + "/" + config.name + "/docker-compose.yml";

    if(!await sftp.exists(dockerComposeRemoteFile))
        throw Error("Cannot find docker compose file in remote host");

    const dockerComposeBuffer = await sftp.get(dockerComposeRemoteFile);

    const volumes = getVolumesToBackup(dockerComposeBuffer.toString(), config.volume);

    await sftp.mkdir(`/tmp/backup`, true);

    const backupDir = config.backupDir ?? path.resolve(process.cwd(), "backup");

    for(const volume of volumes){
        if(!config.silent)
            console.log(`Restoring ${volume} on remote host`);

        const backupFile = path.resolve(backupDir, `${volume}.tar`);
        if(!fs.existsSync(backupFile))
            throw Error("Cannot find backup file");

        let ulStream = fs.createReadStream(backupFile);

        if(!config.silent){
            const progressStream = progress({
                length: fs.statSync(backupFile).size
            });

            progressStream.on('progress', progress => {
                printLine("Upload progress : " + progress.percentage + "%")
            });
            clearLine();

            ulStream = ulStream.pipe(progressStream);
        }

        await sftp.put(ulStream, `/tmp/backup/${volume}.tar`);

        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${dockerComposeRemoteFile} stop -t 0`);
        await execSSH(sftp.client, `docker run -v ${config.name + "_" + volume}:/data -v /tmp/backup:/backup --name=fullstacked-restore busybox sh -c "cd data && rm -rf ./* && tar xvf /backup/${volume}.tar --strip 1"`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${dockerComposeRemoteFile} start`);
        await execSSH(sftp.client, `docker rm fullstacked-restore -f -v`);
    }

    // close connection
    await sftp.end();

    process.exit(0);
}
