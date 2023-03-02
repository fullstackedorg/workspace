import CommandInterface from "fullstacked/commands/CommandInterface";
import {RUN_CMD} from "fullstacked/types/run";
import {resolve} from "path";
import CLIParser from "fullstacked/utils/CLIParser";
import Docker from "fullstacked/utils/docker";
import DockerCompose from "dockerode-compose";
import Info from "fullstacked/commands/info";
import os from "os";
import readline from "readline";
import {Socket} from "net";
import {clearLine, cursorTo} from "readline";

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
            type: "string[]",
            description: "Restart your running Web App",
            defaultDescription: "All containers"
        },
        attach: {
            short: "a",
            type: "string[]",
            description: "Attach to containers for logging"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Run.commandLineArguments);

    async stop(dockerCompose){
        const dockerClient = await Docker.getClient();
        const services = Object.keys(dockerCompose.recipe.services);
        await Promise.all(services.map(serviceName => new Promise<void>(async resolve => {
            try{
                const container = await dockerClient.getContainer(`${dockerCompose.projectName}_${serviceName}_1`);
                if((await container.inspect()).State.Status === 'running')
                    await container.stop({t: 0});
                await container.remove({force: true, v: true});
            }catch (e) { }

            resolve();
        })));
        try{
            await dockerCompose.down({ volumes: true });
        }catch (e){ }
    }

    async run(): Promise<void> {
        const dockerClient = await Docker.getClient();
        const infos = new Info();
        const dockerCompose = new DockerCompose(dockerClient, this.config.dockerCompose, infos.config.name);

        if(this.config.restart){
            const container = dockerClient.getContainer(`${dockerCompose.projectName}_node_1`);
            try{
                await container.restart({t: 0});
            }catch (e) {
                this.config = {
                    ...this.config,
                    restart: null
                };
                return this.run();
            }
        }else{
            // maybe its running already
            await this.stop(dockerCompose);

            const services = Object.keys(dockerCompose.recipe.services);
            let availablePort = 8000;

            let nodePort;
            for(const service of services){
                const serviceObject = dockerCompose.recipe.services[service];
                await this.maybePullDockerImage(dockerClient, serviceObject.image);
                const exposedPorts = serviceObject.ports;
                if(!exposedPorts) continue;
                for (let i = 0; i < exposedPorts.length; i++) {
                    if(exposedPorts[i].toString().includes(":")) continue;
                    availablePort = await this.getNextAvailablePort(availablePort);
                    serviceObject.ports[i] = `${availablePort}:${exposedPorts[i]}`;
                    if(service === "node") nodePort = availablePort;
                    availablePort++;
                }
            }

            await dockerCompose.up();
            console.log(`${infos.config.name} v${infos.config.version} is running at http://localhost:${nodePort}`);
        }

        this.config.attach?.forEach(containerName => {
            const container = dockerClient.getContainer(`${dockerCompose.projectName}_${containerName}_1`);
            container.attach({stream: true, stdout: true, stderr: true})
                .then(stream => container.modem.demuxStream(stream, process.stdout, process.stderr));
        });

        if(this.config.attach){
            if(os.platform() === "win32"){
                //source : https://stackoverflow.com/a/48837698
                readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                }).on('close', function() {
                    process.emit('SIGINT')
                });
            }

            let printStopOnce = false;
            process.on("SIGINT", async () => {

                if(!printStopOnce)
                    process.stdout.write(`\x1b[33mStopping ${dockerCompose.projectName}\x1b[0m\r\n`);

                printStopOnce = true;
                await this.stop(dockerCompose);
                process.exit(0);
            });
        }
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



    private getNextAvailablePort(port: number = 8000): Promise<number> {
        return new Promise((resolve, reject) => {
            const socket = new Socket();

            const timeout = () => {
                resolve(port);
                socket.destroy();
            };

            const next = () => {
                socket.destroy();
                resolve(this.getNextAvailablePort(++port));
            };

            setTimeout(timeout, 200);
            socket.on("timeout", timeout);

            socket.on("connect", function () {
                next();
            });

            socket.on("error", function (exception) {
                if ((exception as any).code !== "ECONNREFUSED") {
                    reject(exception);
                } else {
                    timeout();
                }
            });

            socket.connect(port, "0.0.0.0");
        });
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
