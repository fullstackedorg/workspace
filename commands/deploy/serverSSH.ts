import Docker from "fullstacked/utils/docker";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";
import {execSync} from "child_process";
import {fileURLToPath} from "url";
import {dirname} from "path";
import Dockerode from "dockerode";
import randStr from "fullstacked/utils/randStr";

export default class ServerSSH {
    container: {
        instance: Dockerode.Container,
        name: string,
        username: string,
        password: string,
        portSSH: number,
        portHTTP: number,
    };

    async init(): Promise<typeof this.container> {
        const dockerClient = await Docker.getClient();

        const FullStackedServerSSHImageName = "fullstacked-server-ssh";

        console.log("Building FullStacked Server SSH Docker image");

        const stream = await dockerClient.buildImage({
            context: dirname(fileURLToPath(import.meta.url)),
            src: ["Dockerfile"]
        }, {t: FullStackedServerSSHImageName});

        await new Promise((resolve, reject) => {
            dockerClient.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
        });

        this.container = {
            name: "fullstacked_server_ssh_" + randStr(),
            username: "root",
            password: "docker",
            portSSH: await getNextAvailablePort(2222),
            portHTTP: await getNextAvailablePort(8000),
            instance: null,
        }

        const containerConfig = {
            name: this.container.name,
            Image: FullStackedServerSSHImageName,
            ExposedPorts: {
                '22/tcp': {},
                '80/tcp': {}
            },
            HostConfig: {
                Privileged: true,
                PortBindings: {
                    ["22/tcp"]: [{ HostPort: this.container.portSSH.toString() }],
                    ["80/tcp"]: [{ HostPort : this.container.portHTTP.toString() }],
                }
            },
        }

        console.log("Starting Server SSH");

        this.container.instance = await dockerClient.createContainer(containerConfig);
        await this.container.instance.start();

        console.log("Setting up SSH");

        const exec = await this.container.instance.exec({Cmd: ["/bin/sh", "-c", `echo -n \"${this.container.username}:${this.container.password}\" | chpasswd`]});
        await exec.start({});

        const exec2 = await this.container.instance.exec({Cmd: ["/usr/sbin/sshd", "-D"]});
        await exec2.start({});

        return new Promise(resolve => {
            const interval = setInterval(() => {
                try{
                    execSync(`docker exec ${this.container.name} docker ps`, {stdio: "ignore"});
                    clearInterval(interval);
                    console.log(`Local Server SSH running`);
                    console.log(`Accessible through SSH at ${this.container.username}@0.0.0.0 -p ${this.container.portSSH}`);
                    console.log(`Password: docker`);
                    console.log(`Port tcp/80 map to http://localhost:${this.container.portHTTP}`);
                    return resolve(this.container);
                }catch (e) {}
            }, 200);
        });
    }

    stop(){
        return this.container.instance.remove({v: true, force: true})
    }
}
