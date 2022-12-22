import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import {
    getSFTPClient,
    getVolumesToBackup,
    maybePullDockerImage,
    printLine,
    execSSH, getBuiltDockerCompose,
} from "../utils/utils.js";
import {sshCredentials} from "../types/deploy.js";
import uploadFileWithProgress from "../utils/uploadFileWithProgress.js";
import yaml from "js-yaml";

export default async function (config: FullStackedConfig) {
    if(config.host)
        return await restoreRemote(config);

    const dockerCompose = getBuiltDockerCompose(config.src);
    const volumesToRestore = getVolumesToBackup(yaml.dump(dockerCompose), config.volume);

    const services = Object.keys(dockerCompose.services);

    await maybePullDockerImage(config.docker, "busybox");

    for(const volume of volumesToRestore){
        if(!config.silent)
            console.log(`Restoring ${volume} on local host`);

        const backupDir = config.backupDir ?? path.resolve(process.cwd(), "backup");

        const backupFile = path.resolve(backupDir, `${volume}.tar`);
        if(!fs.existsSync(backupFile)) {
            console.log(`Cannot find backup file for volume ${volume}`);
            continue;
        }

        await Promise.all(services.map(serviceName => new Promise<void>(async resolve => {
            const container = await config.docker.getContainer(`${config.name}_${serviceName}_1`);
            await container.stop();
            resolve();
        })));

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

        await Promise.all(services.map(serviceName => new Promise<void>(async resolve => {
            const container = await config.docker.getContainer(`${config.name}_${serviceName}_1`);
            await container.start();
            resolve();
        })));
    }
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
