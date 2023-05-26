import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import fs from "fs";
import {resolve} from "path";
import type Deploy from "../deploy";
import {maybePullDockerImage} from "fullstacked/utils/maybePullDockerImage";
import yaml from "js-yaml";
import Docker from "fullstacked/utils/docker";
import randStr from "fullstacked/utils/randStr";
import Info from "fullstacked/info";

// source: https://stackoverflow.com/a/43001581
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const deployModuleLocation = new URL("../deploy/index.js", import.meta.url);
const DeployModule = (fs.existsSync(deployModuleLocation)
    ? (await import(deployModuleLocation.toString())).default
    : null) as typeof Deploy;

const deployCommandLineArgs = (DeployModule
    ? DeployModule.commandLineArguments
    : {}) as Writeable<typeof Deploy.commandLineArguments>;

delete deployCommandLineArgs.dryRun;
delete deployCommandLineArgs.outputDir;

export default class Backup extends CommandInterface {
    static commandLineArguments = {
        dockerCompose: {
            type: "string",
            short: "d",
            default: resolve(process.cwd(), "dist", "docker-compose.yml"),
            defaultDescription: "./dist/docker-compose.yml",
            description: "Your bundled docker-compose.yml location"
        },
        volume: {
            type: "string[]",
            short: "v",
            defaultDescription: "All Volumes"
        },
        restore: {
            type: "boolean",
            short: "r",
            defaultDescription: "false",
            description: "Put back local backup into your running Web App"
        },
        backupDir: {
            type: "string",
            short: "b",
            defaultDescription: "./backup",
            default: resolve(process.cwd(), "backup"),
            description: "Define a local directory for your archives files"
        },
        remote: {
            type: "boolean",
            defaultDescription: "false",
            description: "Requires @fullstacked/deploy\nBackup or restore your remote host"
        },
        ...deployCommandLineArgs
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Backup.commandLineArguments);

    deploy = DeployModule ? new DeployModule() : null;

    async restoreRemote(volumes: string[]){
        const sftp = await this.deploy.getSFTP();

        const webAppDir = `${this.deploy.credentialsSSH.directory}/${Info.webAppName}`;
        const deployedVersions = await sftp.list(webAppDir);
        if(deployedVersions.length > 1)
            throw new Error("Multiple version directory in remote server. Aborting...");

        const currentWebAppHash = deployedVersions.at(0).name;
        const dockerComposeRemoteFile = `${webAppDir}/${currentWebAppHash}/docker-compose.yml`;
        const dockerComposeProjectName = `${Info.webAppName}-${currentWebAppHash}`

        await sftp.mkdir(`/tmp/backup`, true);

        for(const volume of volumes){
            console.log(`Restoring ${volume} on remote host`);

            const backupFile = resolve(this.config.backupDir, `${volume}.tar`);
            if(!fs.existsSync(backupFile)) {
                console.log(`Cannot find backup file for volume ${volume}`);
                continue;
            }

            await this.deploy.uploadFileWithProgress(backupFile, `/tmp/backup/${volume}.tar`, `[${volume}] `);
            this.endLine();

            await this.deploy.execOnRemoteHost(`docker compose -p ${dockerComposeProjectName} -f ${dockerComposeRemoteFile} stop -t 0`);
            await this.deploy.execOnRemoteHost(`docker run -v ${Info.webAppName + "_" + volume}:/data -v /tmp/backup:/backup --name=fullstacked-restore busybox sh -c "cd data && rm -rf ./* && tar xvf /backup/${volume}.tar --strip 1"`);
            await this.deploy.execOnRemoteHost(`docker compose -p ${dockerComposeProjectName} -f ${dockerComposeRemoteFile} start`);
            await this.deploy.execOnRemoteHost(`docker rm fullstacked-restore -f -v`);
        }

        // close connection
        await sftp.end();
    }

    async backupRemote(volumes: string[]) {
        const sftp = await this.deploy.getSFTP();

        if(!fs.existsSync(this.config.backupDir))
            fs.mkdirSync(this.config.backupDir, {recursive: true});

        for(const volume of volumes){
            console.log(`Backing up ${volume} from remote host`);

            const commandArr = ["docker", "run",
                "-v", Info.webAppName + "_" + volume + ":/data",
                "-v", "/tmp/backup:/backup",
                "--name=fullstacked-backup",
                "busybox",
                "tar cvf backup/" + volume + ".tar data"
            ]
            await this.deploy.execOnRemoteHost(commandArr.join(" "));
            await this.deploy.execOnRemoteHost(`docker rm fullstacked-backup -f -v`);

            const tarFilePath = `/tmp/backup/${volume}.tar`;
            const outFilePath = resolve(this.config.backupDir, `${volume}.tar`);
            await this.deploy.downloadWithProgress(tarFilePath, outFilePath);
        }

        // close connection
        await sftp.end();
    }


    filterVolumes(dockerCompose: any){
        const volumes = [];
        for (const volume of Object.keys(dockerCompose.volumes))
            if(!this.config.volume || this.config.volume.includes(volume))
                volumes.push(volume);

        return volumes;
    }

    async restoreLocally(volumes: string[]){
        const dockerClient = await Docker.getClient();

        await Promise.all(volumes.map(async volume => {
            const backupFile = resolve(this.config.backupDir, `${volume}.tar`);
            const restoreContainerName = "fullstacked_restore_" + randStr();
            if(!fs.existsSync(backupFile)) {
                console.log(`Cannot find backup file for volume ${volume} at [${backupFile}]`);
                return;
            }

            console.log(`Restoring ${volume} on localhost`);

            const [output, container] = await dockerClient.run(
                "busybox",
                ["/bin/sh", "-c", "sleep 5 && cd data && rm -rf ./* && tar xvf /backup/" + volume + ".tar --strip 1"],
                process.stdout,
                {
                    name: restoreContainerName,
                    HostConfig: {
                        Binds: [
                            Info.webAppName + "_" + volume + ":/data",
                            this.config.backupDir + ":/backup"
                        ],
                    }
                }
            );

            await container.remove({v: true});
        }));
    }

    async backupLocally(volumes: string[]){
        const dockerClient = await Docker.getClient();

        return Promise.all(volumes.map(async volume => {
            console.log(`Backing up ${volume} from localhost`);
            const backupContainerName = "fullstacked_backup_" + randStr();
            const [output, container] = await dockerClient.run(
                "busybox",
                ["/bin/sh", "-c", "sleep 5 && tar cvf backup/" + volume + ".tar data"],
                process.stdout,
                {
                    name: backupContainerName,
                    HostConfig: {
                        Binds: [
                            Info.webAppName + "_" + volume + ":/data",
                            this.config.backupDir + ":/backup"
                        ],
                    }
                }
            );
            await container.remove({v: true});
        }));
    }

    async run() {
        if(this.config.remote && !this.deploy)
            throw Error("Install the Deploy command to backup and restore your remote server [npm i @fullstacked/deploy]");

        const volumes = this.filterVolumes(yaml.load(fs.readFileSync(this.config.dockerCompose).toString()));
        if(!volumes.length)
            throw Error("No volumes defined in bundled docker compose or volumes not found");

        if(this.config.remote){
            if (this.config.restore)
                return this.restoreRemote(volumes);
            else
                return this.backupRemote(volumes);
        }else{
            await maybePullDockerImage("busybox");

            if(this.config.restore)
                return this.restoreLocally(volumes);
            else
                return this.backupLocally(volumes);
        }
    }

    async runCLI() {
        if(this.config.remote && this.deploy) {
            if(!await this.deploy.tryToLoadLocalConfigCLI())
                await this.deploy?.setupCredentialsWithConfigAndPrompts();
        }
        return this.run();
    }

}
