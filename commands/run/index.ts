import CommandInterface from "fullstacked/commands/CommandInterface";
import {RUN_CMD} from "fullstacked/types/run";
import {dirname, resolve} from "path";
import CLIParser from "fullstacked/utils/CLIParser";
import Docker from "fullstacked/utils/docker";
import DockerCompose from "dockerode-compose";
import Info from "fullstacked/commands/info";
import Dockerode from "dockerode";
import {clearLine, cursorTo} from "readline";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";

export default class Run extends CommandInterface {
    static commandLineArguments = {
        dockerCompose: {
            type: "string",
            short: "d",
            default: resolve(process.cwd(), "dist", "docker-compose.yml"),
            description: "Bundled docker compose file to run",
            defaultDescription: "./dist/docker-compose.yml"
        },
        pull: {
            type: "boolean",
            description: "Pull latest images for Web App",
            defaultDescription: "false"
        },
        restart: {
            type: "boolean",
            short: "r",
            description: "Restart your running Web App",
            defaultDescription: "false"
        },
        stop: {
            type: "boolean",
            short: "s",
            description: "Stop your running Web App",
            defaultDescription: "false"
        },
        attach: {
            short: "a",
            type: "string[]",
            description: "Attach to containers for logs",
            defaultDescription: "None, runs detached"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Run.commandLineArguments);

    dockerCompose: DockerCompose;
    dockerClient: Dockerode;
    infos: Info;

    async stop(){
        const services = Object.keys(this.dockerCompose.recipe.services);
        await Promise.all(services.map(serviceName => new Promise<void>(async resolve => {
            try{
                const container = await this.dockerClient.getContainer(`${this.dockerCompose.projectName}_${serviceName}_1`);
                if((await container.inspect()).State.Status === 'running')
                    await container.stop({t: 0});
                await container.remove({force: true, v: true});
            }catch (e) { }

            resolve();
        })));
        try{
            await this.dockerCompose.down({ volumes: true });
        }catch (e){ }

        console.log(`${this.infos.config.name} v${this.infos.config.version} stopped`);
    }

    async start(){
        const services = Object.keys(this.dockerCompose.recipe.services);
        let availablePort = 8000;

        let nodePort;
        for(const service of services){
            const serviceObject = this.dockerCompose.recipe.services[service];
            await this.maybePullDockerImage(this.dockerClient, serviceObject.image);
            const exposedPorts = serviceObject.ports;
            if(!exposedPorts) continue;
            for (let i = 0; i < exposedPorts.length; i++) {
                if(exposedPorts[i].toString().includes(":")) continue;
                availablePort = await getNextAvailablePort(availablePort);
                serviceObject.ports[i] = `${availablePort}:${exposedPorts[i]}`;
                if(service === "node") nodePort = availablePort;
                availablePort++;
            }
        }

        await this.dockerCompose.up();

        console.log(`${this.infos.config.name} v${this.infos.config.version} is running at http://localhost:${nodePort}`);
    }

    async run(): Promise<void> {
        this.dockerClient = await Docker.getClient();
        this.infos = new Info();
        this.dockerCompose = new DockerCompose(this.dockerClient, this.config.dockerCompose, this.infos.config.name);

        if (this.config.stop) {
            return this.stop();
        }

        const container = this.dockerClient.getContainer(`${this.dockerCompose.projectName}_node_1`);
        if (this.config.restart) {
            try{
                await container.restart({t: 0});
            }catch (e) {
                // not even running, lets start
                await this.start()
            }
        }

        else {
            // basic run start command
            try{
                // might be already running
                const port = (await container.inspect()).HostConfig.PortBindings["80/tcp"].at(0).HostPort;
                console.log(`${this.infos.config.name} v${this.infos.config.version} already running at http://localhost:${port}`);
            }catch (e) {
                await this.start()
            }
        }

        // attach
        this.config.attach?.forEach(containerName => {
            const container = this.dockerClient.getContainer(`${this.dockerCompose.projectName}_${containerName}_1`);
            container.attach({stream: true, stdout: true, stderr: true})
                .then(stream => container.modem.demuxStream(stream, process.stdout, process.stderr));
        });

        if(!this.config.attach) return;

        process.on("SIGINT", () => {
            this.stop().then(() => process.exit(0));
        });
    }

    runCLI(): Promise<void> {
        return this.run();
    }

    guiCommands(): { cmd: RUN_CMD; callback(data, tick?: () => void): any }[] {
        return [
            {
                cmd: RUN_CMD.START,
                callback: () => this.run()
            },{
                cmd: RUN_CMD.BENCH,
                async callback({url}) {
                    const start = Date.now();
                    await fetch(url);
                    return Date.now() - start;
                }
            }
        ];
    }

    private async maybePullDockerImage(docker, image){
        try{
            await (await docker.getImage(image)).inspect();
        }catch (e){
            const pullStream = await docker.pull(image);
            await new Promise<void>(resolve => {
                pullStream.on("data", dataRaw => {
                    const dataParts = dataRaw.toString().match(/{.*}/g);
                    dataParts.forEach((part) => {
                        const {status, progress} = JSON.parse(part);
                        process.stdout.write(`[${image}] ${status} ${progress || " "}`);
                    });

                })
                pullStream.on("end", () => {
                    clearLine(process.stdout, 0);
                    cursorTo(process.stdout, 0, null);
                    resolve();
                });
            });
        }
    }
}
