import CommandInterface from "fullstacked/CommandInterface";
import {dirname, resolve} from "path";
import CLIParser from "fullstacked/utils/CLIParser";
import Docker from "fullstacked/utils/docker";
import DockerCompose from "dockerode-compose";
import Info from "fullstacked/info";
import Dockerode from "dockerode";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";
import {maybePullDockerImage} from "fullstacked/utils/maybePullDockerImage";
import sleep from "fullstacked/utils/sleep";
import {execSync} from "child_process";

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
            description: "Restart only node from your running Web App",
            defaultDescription: "false"
        },
        restartAll: {
            type: "boolean",
            description: "Restart all containers from your running Web App",
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

    async stop(){
        const services = Object.keys(this.dockerCompose.recipe.services);
        await Promise.all(services.map(serviceName => new Promise<void>(async resolve => {
            try{
                const container = await this.dockerClient.getContainer(`${this.dockerCompose.projectName}_${serviceName}_1`);
                if((await container.inspect()).State.Status === 'running')
                    await container.stop({t: 0});
                await container.remove({force: true});
            }catch (e) { }

            resolve();
        })));
        try{
            await this.dockerCompose.down();
        }catch (e){ }

        console.log(`${Info.webAppName} v${Info.version} stopped`);
    }

    async startNative(){
        const workdir = dirname(this.config.dockerCompose);
        const port = await getNextAvailablePort(8000);
        console.log(`${Info.webAppName} v${Info.version} is running at http://localhost:${port}`);
        if(process.platform === "win32")
            execSync(`set PORT=${port} && node --enable-source-maps server/index.mjs`, { cwd: workdir, stdio: "inherit" });
        else
            execSync(`PORT=${port} node --enable-source-maps server/index.mjs`, { cwd: workdir, stdio: "inherit" });
    }

    async start(){
        const services = Object.keys(this.dockerCompose.recipe.services);

        if(services.length === 1){
            return this.startNative();
        }

        let availablePort = 8000;
        let nodePort;
        for(const service of services){
            const serviceObject = this.dockerCompose.recipe.services[service];
            await maybePullDockerImage(serviceObject.image);
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

        console.log(`${Info.webAppName} v${Info.version} is running at http://localhost:${nodePort}`);
    }

    async run(): Promise<void> {
        this.dockerClient = await Docker.getClient();
        this.dockerCompose = new DockerCompose(this.dockerClient, this.config.dockerCompose, Info.webAppName);

        if (this.config.stop) {
            return this.stop();
        }

        const nodeContainer = this.dockerClient.getContainer(`${this.dockerCompose.projectName}_node_1`);
        if (this.config.restart || this.config.restartAll) {
            try{
                await nodeContainer.restart({t: 0});
            }catch (e) {
                // not even running, lets start
                await this.start()
            }

            if(this.config.restartAll) {
                await Promise.all(Object.keys(this.dockerCompose.recipe.services).map(containerName => {
                    if (containerName === "node") return;

                    const container = this.dockerClient.getContainer(`${this.dockerCompose.projectName}_${containerName}_1`);
                    return container.restart();
                }));
            }
        }

        else {
            // basic run start command
            try{
                // might be already running
                const port = (await nodeContainer.inspect()).HostConfig.PortBindings["8000/tcp"].at(0).HostPort;
                console.log(`${Info.webAppName} v${Info.version} already running at http://localhost:${port}`);
            }catch (e) {
                await this.start()
            }
        }

        // attach
        this.config.attach?.forEach(containerName => this.attachToContainer(containerName))

        if(!this.config.attach) return;

        process.on("SIGINT", () => {
            this.stop().then(() => process.exit(0));
        });
    }

    async attachToContainer(containerName: string){
        const container = this.dockerClient.getContainer(`${this.dockerCompose.projectName}_${containerName}_1`);
        try{
            const stream = await container.attach({stream: true, stdout: true, stderr: true})
            container.modem.demuxStream(stream, process.stdout, process.stderr);
            stream.on("end", () => this.attachToContainer(containerName));
        }catch (e){
            await sleep(100);
            await this.attachToContainer(containerName);
        }
    }

    runCLI(): Promise<void> {
        return this.run();
    }
}
