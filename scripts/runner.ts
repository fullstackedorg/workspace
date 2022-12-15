import {execScript, getNextAvailablePort, isDockerInstalled, maybePullDockerImage} from "./utils.js";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import DockerCompose from "dockerode-compose";

// helper to start/restart/attach/stop your app
export default class Runner {
    config: Config;
    composeFilePath: string;
    nodePort: number;
    dockerCompose: any;

    constructor(config: Config) {
        this.config = config;
        this.composeFilePath = path.resolve(this.config.dist, "docker-compose.yml");

        if(!isDockerInstalled())
            throw new Error("Cannot run app without Docker and Docker-Compose");
    }

    async start(): Promise<number> {
        await execScript(path.resolve(this.config.src, "prerun.ts"), this.config);

        this.dockerCompose = new DockerCompose(this.config.docker, this.composeFilePath, this.config.name);

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
        // stop docker-compose and remove all volumes (cleaner)
        const nodeContainer = await this.config.docker.getContainer(this.dockerCompose.projectName + '_node_1');
        if((await nodeContainer.inspect()).State.Status === 'running')
            await nodeContainer.stop({t: 0});
        await this.dockerCompose.down({ volumes: true });
    }
}
