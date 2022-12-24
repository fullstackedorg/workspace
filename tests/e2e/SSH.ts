import {execSync} from "child_process";
import { maybePullDockerImage, printLine, silenceCommandLine} from "../../utils/utils";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import Docker from "../../utils/docker";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const imageSafeName = (str) => str.replace(/:/g, "_");

export default class {
    containers: {
        container: any,
        name,
        sshPort,
        httpPort,
    }[];
    username = "root"
    password = "docker"
    docker;

    async init(count: number = 1, images?: string[]){
        this.docker = await Docker();
        if(images){
            for(const image of images){
                await maybePullDockerImage(this.docker, image);

                if(fs.existsSync(`${imageSafeName(image)}.tar`)) continue;

                printLine(`Saving image ${image}`);
                execSync(`docker save --output ${imageSafeName(image)}.tar ${image}`, {stdio: "inherit"});
            }
        }

        const sshServerContainerName = "fullstacked-ssh-server"

        printLine("Building FullStacked SSH Server Image");

        await this.docker.buildImage({
            context: __dirname,
            src: ["Dockerfile"]
        }, {t: sshServerContainerName});


        const containers = new Array(count).fill(null);

        const setupPromises = containers.map((_, index) => new Promise<any>(async res => {
            const container = {
                name: "dind-" + index,
                sshPort: 2222 + index,
                httpPort: 8000 + index,
                container: null,
            }

            const containerConfig = {
                name: container.name,
                Image: sshServerContainerName,
                ExposedPorts: {
                    '22/tcp':{},
                    '80/tcp':{}
                },
                HostConfig: {
                    Privileged: true,
                    PortBindings: {
                        ["22/tcp"]: [{ HostPort: container.sshPort.toString() }],
                        ["80/tcp"]: [{ HostPort : container.httpPort.toString() }],
                    },
                    Binds: [
                        `${resolve(process.cwd()).replace(/\\/g, "/").replace(/C:/, "/c")}:/images`
                    ]
                },
            }

            printLine("Setting up dind container with SSH");

            container.container = await this.docker.createContainer(containerConfig);
            await container.container.start();

            printLine("Installing ssh server");

            const exec = await container.container.exec({Cmd: ["/bin/sh", "-c", `echo -n \"${this.username}:${this.password}\" | chpasswd`]});
            await exec.start();

            const exec2 = await container.container.exec({Cmd: ["/usr/sbin/sshd", "-D"]});
            await exec2.start();

            await new Promise<void>(resolve => {
                const interval = setInterval(() => {
                    try{
                        execSync(silenceCommandLine(`docker exec ${container.name} docker ps`));
                        clearInterval(interval);
                        return resolve();
                    }catch (e) {}
                }, 200);
            });

            if(images){
                printLine("Loading Images")
                await Promise.all(images.map(image => new Promise(async resolve => {
                    const loadExec = await container.container.exec({
                        Cmd: ["docker", "load", "--input", `/images/${imageSafeName(image)}.tar`],
                        AttachStdout: true,
                        AttachStderr: true,
                    });
                    const stream = await loadExec.start();
                    stream.on("data", chunk => printLine(chunk.toString().trim()));
                    stream.on("end", resolve);
                })));
            }

            res(container)
        }));

        this.containers = await Promise.all(setupPromises);

        printLine("SSH Servers ready");
    }

    stop(){
        this.containers.forEach(container => {
            container.container.remove({v: true, force: true})
        });
    }
}
