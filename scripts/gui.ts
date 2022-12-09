import Server from "../server";
import {getNextAvailablePort} from "./utils";
import Run from "./run";
import Config from "./config";
import path from "path";
import waitForServer from "./waitForServer";
import open from "open";
import fs from "fs";
import yaml from "yaml";
import {IncomingMessage} from "http";
import {testSSHConnection} from "./deploy";

const endpoints = [
    {
        path: "/ssh",
        callback: async (req, res) => {
            try{
                return await testSSHConnection(req.body);
            }catch (e){
                return JSON.stringify({error: e.message});
            }
        }
    }
]

function readBody(req){
    return new Promise<any>(resolve => {
        let data = "";
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data ? JSON.parse(data) : null));
    });
}

export default async function (){
    Server.port = await getNextAvailablePort();
    Server.start();
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Max-Age': 2592000
    };
    Server.addListener(async (req: IncomingMessage & {body: any}, res) => {
        if (req.method === 'OPTIONS') {
            res.writeHead(204, headers);
            return res.end();
        }

        for(const endpoint of endpoints) {
            if(endpoint.path !== req.url || res.headersSent) continue;

            if(req.method === "POST")
                req.body = await readBody(req);

            res.writeHead(200, {
                ...headers,
                'content-type': 'application/json'
            });
            res.write(await endpoint.callback(req, res));
            return res.end();
        }
    }, true);

    const dockerComposeFile = path.resolve(__dirname, "..", "gui", "dist", "docker-compose.yml");
    const dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFile, {encoding: "utf-8"}));
    dockerCompose.services.node.command = `node index --port=${Server.port}`;
    fs.writeFileSync(dockerComposeFile, yaml.stringify(dockerCompose));
    const runner = await Run(Config({
        src: path.resolve(__dirname, "..", "gui"),
        out: path.resolve(__dirname, "..", "gui")
    }), false);
    await waitForServer(3000, `http://localhost:${runner.nodePort}`);
    return open(`http://localhost:${runner.nodePort}`);
}
