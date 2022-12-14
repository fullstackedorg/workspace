import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import {getSFTPClient, getVolumesToBackup, printLine, silenceCommandLine, uploadFileWithProgress} from "./utils";
import {execSSH} from "./utils";
import {sshCredentials} from "../types/deploy";
import DockerCompose from "dockerode-compose";

export default async function (config: FullStackedConfig) {
    if(config.host)
        return await restoreRemote(config);

    const dockerComposeFile = path.resolve(config.dist, "docker-compose.yml");
    const volumesToRestore = getVolumesToBackup(fs.readFileSync(dockerComposeFile, {encoding: "utf-8"}), config.volume);

    const dockerCompose = new DockerCompose(config.docker, dockerComposeFile, config.name);
    await dockerCompose.down();

    try{
        await (await config.docker.getImage("busybox")).inspect()
    }catch (e){
        const pullStream = await config.docker.pull("busybox");
        await new Promise(resolve => {
            pullStream.on("end", resolve);
        });
    }

    for(const volume of volumesToRestore){
        if(!config.silent)
            console.log(`Restoring ${volume} on local host`);

        const backupDir = config.backupDir ?? path.resolve(process.cwd(), "backup");

        const backupFile = path.resolve(backupDir, `${volume}.tar`);
        if(!fs.existsSync(backupFile)) {
            console.log(`Cannot find backup file for volume ${volume}`);
            continue;
        }

        const [output, container] = await config.docker.run("busybox", ["/bin/sh", "-c", "sleep 5 && cd data && rm -rf ./* && tar xvf /backup/" + volume + ".tar --strip 1"], process.stdout, {
            name: "fullstacked-restore",
            HostConfig: {
                Binds: [
                    config.name + "_" + volume + ":/data",
                    backupDir + ":/backup"
                ],
            }
        });

        await container.remove({v: true});
    }

    await dockerCompose.up();
}

async function restoreRemote(config: FullStackedConfig){
    const sftp = await getSFTPClient({
        ...config,
        port: config.sshPort
    } as sshCredentials);

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
        if(!fs.existsSync(backupFile)) {
            console.log(`Cannot find backup file for volume ${volume}`);
            continue;
        }

        await uploadFileWithProgress(sftp, backupFile, `/tmp/backup/${volume}.tar`, progress => {
            printLine(`[${volume}] ${progress}`)
        });

        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${dockerComposeRemoteFile} stop -t 0`);
        await execSSH(sftp.client, `docker run -v ${config.name + "_" + volume}:/data -v /tmp/backup:/backup --name=fullstacked-restore busybox sh -c "cd data && rm -rf ./* && tar xvf /backup/${volume}.tar --strip 1"`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${dockerComposeRemoteFile} start`);
        await execSSH(sftp.client, `docker rm fullstacked-restore -f -v`);
    }

    // close connection
    await sftp.end();

    process.exit(0);
}
