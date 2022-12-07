import {FullStackedConfig} from "../index";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import {buildSync} from "esbuild";
import {execSync} from "child_process";

export default function (config: FullStackedConfig){
    fs.cpSync(path.resolve(__dirname, "..", "node_modules", "@tabler", "core", "dist", "css", "tabler.css"), path.resolve(config.public, "tabler.css"));
    fs.cpSync(path.resolve(__dirname, "nginx-root.conf"), path.resolve(config.dist, "nginx-root.conf"));

    const dockerComposeFilePath = path.resolve(config.dist, "docker-compose.yml");
    const dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"}));

    if(!dockerCompose.services.node.volumes.includes("/var/run/docker.sock:/var/run/docker.sock")) {
        dockerCompose.services.node.volumes.push("/var/run/docker.sock:/var/run/docker.sock");
    }

    if(!dockerCompose.services.node.volumes.includes("/etc/letsencrypt/archive:/etc/letsencrypt/archive")){
        dockerCompose.services.node.volumes.push("/etc/letsencrypt/archive:/etc/letsencrypt/archive");
    }

    if(!dockerCompose.services.node.command.includes("--prevent-auto-start"))
        dockerCompose.services.node.command += " --prevent-auto-start";

    if(config.production){
        delete dockerCompose.services.node.ports;
        dockerCompose.services.node.network_mode = "host";
        if(!dockerCompose.services.node.volumes.includes("../:/apps")) {
            dockerCompose.services.node.volumes.push("../:/apps");
        }
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
