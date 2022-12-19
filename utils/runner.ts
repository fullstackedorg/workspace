import {execScript, getNextAvailablePort, isDockerInstalled, maybePullDockerImage} from "./utils.js";
import path, {resolve} from "path";
import DockerCompose from "dockerode-compose";
import {FullStackedConfig} from "../index";

export default class Runner {
    config: FullStackedConfig;
    nodePort: number;
    dockerCompose: any;

    constructor(config: FullStackedConfig) {
        this.config = config;
        this.dockerCompose = new DockerCompose(this.config.docker, resolve(this.config.dist, "docker-compose.yml"), this.config.name);

        if(!isDockerInstalled())
            throw new Error("Cannot run app without Docker and Docker-Compose");
    }

    async start(): Promise<number> {
        await execScript(path.resolve(this.config.src, "prerun.ts"), this.config);

        try{
            await this.dockerCompose.down();
        }catch(e){}

        // setup exposed ports
        const services = Object.keys(this.dockerCompose.recipe.services);
        let availablePort = 8000;

        for(const service of services){
            const serviceObject = this.dockerCompose.recipe.services[service];

            await maybePullDockerImage(this.config.docker, serviceObject.image);

            const exposedPorts = serviceObject.ports;

            if(!exposedPorts) continue;

            for (let i = 0; i < exposedPorts.length; i++) {
                if(exposedPorts[i].includes(":")) continue;

                availablePort = await getNextAvailablePort(availablePort);

                serviceObject.ports[i] = `${availablePort}:${exposedPorts[i]}`;

                if(service === "node") this.nodePort = availablePort;

                availablePort++;
            }
        }

        // force pull process
        if(this.config.pull) {
            console.log("Pulling latest images")
            await this.dockerCompose.pull();
        }

        await this.dockerCompose.up();

        await execScript(path.resolve(this.config.src, "postrun.ts"), this.config);

        return this.nodePort;
    }

    async restart(){
        await this.config.docker.getContainer(this.dockerCompose.projectName + '_node_1').restart({t: 0});
    }

    // attach to docker-compose
    async attach(stdout: typeof process.stdout, containerName = "node"){
        const container = this.config.docker.getContainer(`${this.dockerCompose.projectName}_${containerName}_1`);
        const stream = await container.attach({stream: true, stdout: true, stderr: true});
        stream.pipe(stdout);
    }

    async stop(){
        const services = Object.keys(this.dockerCompose.recipe.services);
        await Promise.all(services.map(serviceName => new Promise<void>(async resolve => {
            try{
                const container = await this.config.docker.getContainer(`${this.dockerCompose.projectName}_${serviceName}_1`);
                if((await container.inspect()).State.Status === 'running')
                    await container.stop({t: 0});
                await container.remove({force: true, v: true});
            }catch (e) {}

            resolve();
        })));
        try{
            await this.dockerCompose.down({ volumes: true });
        }catch (e){}
    }
}
