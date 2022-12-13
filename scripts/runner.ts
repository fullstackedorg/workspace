import {execScript, getNextAvailablePort, isDockerInstalled} from "./utils";
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

        // get compose content
        const dockerCompose: any = yaml.load(fs.readFileSync(this.composeFilePath, {encoding: "utf-8"}));

        // setup exposed ports
        const services = Object.keys(dockerCompose.services);
        let availablePort = 8000;

        for(const service of services){
            const serviceObject = dockerCompose.services[service];
            const exposedPorts = serviceObject.ports;

            if(!exposedPorts) continue;

            for (let i = 0; i < exposedPorts.length; i++) {
                if(exposedPorts[i].includes(":")) continue;

                availablePort = await getNextAvailablePort(availablePort);

                dockerCompose.services[service].ports[i] = `${availablePort}:${exposedPorts[i]}`;

                if(service === "node") this.nodePort = availablePort;

                availablePort++;
            }
        }

        fs.writeFileSync(this.composeFilePath, yaml.dump(dockerCompose));

        this.dockerCompose = new DockerCompose(this.config.docker, this.composeFilePath, this.config.name);

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
        await this.config.docker.getContainer(this.dockerCompose.projectName + '_node_1').stop({t: 0});
        await this.dockerCompose.down({ volumes: true });
    }
}
