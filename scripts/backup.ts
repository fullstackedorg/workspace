import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import {clearLine, execSSH, getSFTPClient, getVolumesToBackup, maybePullDockerImage, printLine} from "./utils.js";
import progress from "progress-stream";
import {sshCredentials} from "../types/deploy.js";

export default async function (config: FullStackedConfig) {
    if(config.host)
        return await backupRemote(config);

    if(!fs.existsSync(path.resolve(config.dist, "docker-compose.yml")))
        return console.log("Could not find built docker-compose file");

    const dockerComposeFile = path.resolve(config.dist, "docker-compose.yml");
    const volumesToBackup = getVolumesToBackup(fs.readFileSync(dockerComposeFile, {encoding: "utf8"}), config.volume);

    await maybePullDockerImage(config.docker, "busybox");

    for(const volume of volumesToBackup){
        if(!config.silent)
            console.log(`Backing up ${volume} from local host`);

        const [output, container] = await config.docker.run("busybox", ["/bin/sh", "-c", "sleep 5 && tar cvf backup/" + volume + ".tar data"], process.stdout, {
            name: "fullstacked-backup",
            HostConfig: {
                Binds: [
                    config.name + "_" + volume + ":/data",
                    config.backupDir ?? path.resolve(process.cwd(), "backup") + ":/backup"
                ],
            }
        });

        await container.remove({v: true});
    }
}

async function backupRemote(config: FullStackedConfig){
    const sftp = await getSFTPClient({
        ...config,
        port: config.sshPort
    } as sshCredentials);

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
        const dlStream = fs.createWriteStream(outFilePath);

        // TODO: https://github.com/theophilusx/ssh2-sftp-client/issues/434
        await new Promise<void>(async resolve => {
            let readStream = sftp.createReadStream(tarFilePath, { autoClose: true });
            readStream.once('end', () => {
                clearLine();
                dlStream.close(() => resolve());
            });

            if(!config.silent) {
                const fileStat = await sftp.stat(tarFilePath);

                const progressStream = progress({length: fileStat.size});

                progressStream.on('progress', progress => {
                    printLine("Download progress : " + progress.percentage.toFixed(2) + "%")
                });

                readStream.pipe(progressStream).pipe(dlStream);
            }else{
                readStream.pipe(dlStream);
            }
        });
    }

    // close connection
    await sftp.end();

    process.exit(0);
}
