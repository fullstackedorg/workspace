import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import {buildSync} from "esbuild";

export default function (config: FullStackedConfig){
    fs.cpSync(path.resolve(__dirname, "nginx.conf"), path.resolve(config.dist, "nginx.conf"));

    const dockerComposeFilePath = path.resolve(config.dist, "docker-compose.yml");
    const dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"}));

    if(!dockerCompose.services.node.volumes.includes("fullstacked-server-data:/data")) {
        dockerCompose.services.node.volumes.push("fullstacked-server-data:/data");
        dockerCompose.volumes = {
            "fullstacked-server-data": {}
        }
    }

    dockerCompose.services.node.command += " --prevent-auto-start";

    if(config.production){
        delete dockerCompose.services.node.ports;
        dockerCompose.services.node.network_mode = "host";
    }else{
        dockerCompose.services.node.ports[0] = dockerCompose.services.node.ports.at(0).split(":").at(0) +
            ":8000";
    }

    fs.writeFileSync(dockerComposeFilePath, yaml.stringify(dockerCompose));

    buildSync({
        entryPoints: [path.resolve(__dirname, "server", "AppsMenu.ts")],
        outfile: path.resolve(config.out, "AppsMenu.js"),
        bundle: true,
        minify: true,
        sourcemap: false
    });
}
