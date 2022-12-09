import Server from "../server";
import {getNextAvailablePort} from "./utils";
import Runner from "./runner";
import Config from "./config";
import path from "path";
import waitForServer from "./waitForServer";
import open from "open";
import fs from "fs";
import yaml from "yaml";

export default async function (){
    Server.port = await getNextAvailablePort();
    Server.start();

    const dockerComposeFile = path.resolve(__dirname, "..", "gui", "dist", "docker-compose.yml");
    const dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFile, {encoding: "utf-8"}));
    dockerCompose.services.node.command = `node index --port=${Server.port}`;
    fs.writeFileSync(dockerComposeFile, yaml.stringify(dockerCompose));
    const runner = new Runner(Config({
        src: path.resolve(__dirname, "..", "gui"),
        out: path.resolve(__dirname, "..", "gui")
    }));
    await runner.start();
    await waitForServer(3000, `http://localhost:${runner.nodePort}`);
    return open(`http://localhost:${runner.nodePort}`);
}
