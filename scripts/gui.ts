import Server from "../server";
import {getNextAvailablePort} from "./utils";
import Run from "./run";
import Config from "./config";
import path from "path";
import waitForServer from "./waitForServer";
import open from "open";
import fs from "fs";
import yaml from "yaml";
import {WebSocketServer} from "ws";
import {CommandInterface} from "../CommandInterface";
import {MESSAGE_FROM_GUI, MESSAGE_TYPE} from "../types/gui";
import {DEPLOY_CMD} from "../types/deploy";

export default async function (command: CommandInterface){
    Server.port = await getNextAvailablePort();
    Server.start();

    const wss = new WebSocketServer({ noServer: true });
    wss.on("connection", (ws) => {

        command.write = (str) => ws.send(JSON.stringify({
            type: MESSAGE_TYPE.LOG,
            data: str
        }));
        command.printLine = (str) => ws.send(JSON.stringify({
            type: MESSAGE_TYPE.LINE,
            data: str
        }));
        command.endLine = () => ws.send(JSON.stringify({
            type: MESSAGE_TYPE.END_LINE
        }));
        console.log = (args) => {
            ws.send(JSON.stringify({
                type: MESSAGE_TYPE.LOG,
                data: args
            }));
        }
        process.on('uncaughtException',  (err) => {
            ws.send(JSON.stringify({
                type: MESSAGE_TYPE.ERROR,
                data: err.message
            }));
        });

        ws.onmessage = async (event) => {
            const {cmd, id, data}: MESSAGE_FROM_GUI = JSON.parse(event.data as string);

            if(cmd === DEPLOY_CMD.END){
                await runner.stop();
                process.exit(0);
            }

            for (const guiCommand of command.guiCommands()) {
                if(cmd !== guiCommand.cmd) continue;

                let response = guiCommand.callback(data, () => ws.send(JSON.stringify({
                    type: MESSAGE_TYPE.TICK,
                    id
                })));

                if(response instanceof Promise) response = await response;

                return ws.send(JSON.stringify({
                    type: MESSAGE_TYPE.RESPONSE,
                    id,
                    data: response
                }));
            }

            ws.send(JSON.stringify({
                type: MESSAGE_TYPE.ERROR,
                data: `Cannot find command ${cmd}`
            }))
        }
    });

    Server.server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    });

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
