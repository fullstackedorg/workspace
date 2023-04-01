import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import {globSync} from "glob";
import fs from "fs";
import watcher from "./watcher";
import yaml from "js-yaml";
import {resolve} from "path";


export default class Watch extends CommandInterface {
    static containerImageName = "fullstacked/watcher";
    static fullstackedNodeDockerComposeSpec = {
        services: {
            node: {
                image: Watch.containerImageName,
                working_dir: "/project",
                restart: "unless-stopped",
                expose: ["8000"],
                ports: ["8000"],
                volumes: [`${process.cwd()}:/project`]
            }
        }
    };

    static commandLineArguments = {
        client: {
            type: "string",
            short: "c",
            default: ["./client/index.ts", "./client/index.tsx"].find((defaultFile) => fs.existsSync(defaultFile)),
            description: "Client entry point",
            defaultDescription: "./client/index.ts(x)"
        },
        server: {
            type: "string",
            short: "s",
            default: ["./server/index.ts", "./server/index.tsx"].find((defaultFile) => fs.existsSync(defaultFile)),
            description: "Server entry point",
            defaultDescription: "./server/index.ts(x)"
        },
        dockerCompose: {
            type: "string[]",
            short: "d",
            default: [
                "./docker/compose.yml",
                ...globSync("./docker/**/*.compose.yml")
            ].filter((defaultFiles) => fs.existsSync(defaultFiles)),
            description: "Docker Compose files to be bundled",
            defaultDescription: "./docker/compose.yml, ./docker/*.compose.yml"
        },
        outputDir: {
            type: "string",
            short: "o",
            default: "./dist",
            description: "Output directory where all the bundled files will be",
            defaultDescription: "./dist"
        },
        externalModules: {
            type: "string[]",
            description: "Ignore modules when building.\nYou can also define them at .externalModules in your package.json"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Watch.commandLineArguments);

    async run() {
        if(fs.existsSync(this.config.outputDir))
            fs.rmSync(this.config.outputDir, {recursive: true});

        fs.mkdirSync(this.config.outputDir)

        if(!this.config.dockerCompose.length){
            console.log("IMPLEMENT NATIVE FUNCTIONALITY PLEASE");
        }

        if(process.env.DOCKER){
            await watcher(this.config.client, this.config.server)
            return;
        }

        let fullstackedBuildModule, fullstackedRunModule;
        try{
            //@ts-ignore
            fullstackedBuildModule = (await import("@fullstacked/build")).default;
        }catch (e){
            throw "You need @fullstacked/build to run the watcher with docker compose [ npm i @fullstacked/build ]";
        }

        try{
            //@ts-ignore
            fullstackedRunModule = (await import("@fullstacked/run")).default;
        }catch (e){
            throw "You need @fullstacked/run to run the watcher with docker compose [ npm i @fullstacked/run ]";
        }

        const fullstackedBuild = new fullstackedBuildModule();
        const fullstackedRun = new fullstackedRunModule();

        const watcherComposeSpec = {
            services: {
                node: {
                    ...Watch.fullstackedNodeDockerComposeSpec.services.node,
                    command: [
                        "/bin/sh",
                        "-c",
                        `DOCKER=1 CLIENT_DIR=${this.config.outputDir}/client npx fullstacked watch`
                    ]
                }
            }
        };

        const dockerComposeSpecs = [watcherComposeSpec].concat(this.config.dockerCompose.map((dockerComposeFile) =>
            yaml.load(fs.readFileSync(dockerComposeFile).toString())));
        const mergedDockerCompose = fullstackedBuild.mergeDockerComposeSpecs(dockerComposeSpecs);


        const dockerComposeFileName = `${this.config.outputDir}/fullstacked-watcher.yml`;
        fs.writeFileSync(dockerComposeFileName, yaml.dump(mergedDockerCompose));

        fullstackedRun.config = {
            dockerCompose: dockerComposeFileName
        }

        await fullstackedRun.run();

        await fullstackedRun.attachToContainer("node");

        process.on("SIGINT", () => {
            if(fs.existsSync(dockerComposeFileName)) fs.rmSync(dockerComposeFileName);
            fullstackedRun.stop().then(() => process.exit(0));
        });
    }

    runCLI() {
        return this.run();
    }

}
