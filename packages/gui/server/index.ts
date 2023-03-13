import Server from "@fullstacked/webapp/server"
import createHandler from "typescript-rpc/createHandler";
import Commands from "fullstacked/Commands";
import fs from "fs";
import deploy from "./deploy";
import WebSocket, {WebSocketServer} from "ws";
import {MESSAGE_TYPE} from "../WS";
import CLIParser from "fullstacked/utils/CLIParser";
import {fileURLToPath} from "url";
import { dirname } from "path";

const {port} = CLIParser.getCommandLineArgumentsValues({
    port: {
        type: "number",
        default: 8001
    }
});

Server.port = port;

setTimeout(async () => {
    global.__dirname = fileURLToPath(dirname(import.meta.url));
    const open = (await import("open")).default;
    open(`http://localhost:${port}`);
}, 1000);

Server.pages["/"].addInHead(`<title>FullStacked GUI</title>`);

const api = {
    async installedCommand(){
        return Commands.map(command => ({
            ...command,
            installed: fs.existsSync(`./node_modules/@fullstacked/${command.name}/index.js`)
        }));
    },
    close(){
        process.exit(0);
    },

    deploy
}

export default api;

const handler = createHandler(api);

Server.addListener("/typescript-rpc", {
    name: "typescript-rpc",
    handler
});

const lastListener = Server.listeners.default.pop();
Server.listeners.default.push({
    handler(req, res): any {
        if(req.url.includes(".")) {
            req.url = "/" + req.url.split("/").pop();
            Server.listeners.default.at(0).handler(req, res);
            return;
        }

        res.writeHead(200, {"content-type": "text/html"});
        res.end(Server.pages["/"].toString());
    }
}, lastListener);

const wss = new WebSocketServer({ noServer: true });
const activeWS = new Set<WebSocket>();

wss.on("connection", (ws) => {
    activeWS.add(ws);
    ws.on('close', () => activeWS.delete(ws));
});

console.log = (...args) => {
    activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPE.LOG,
            data: args.join(" ")
        }));
    })
}

export const bindCommandToWS = (command) => {
    command.write = (str) => activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPE.LOG,
            data: str
        }));
    });

    command.printLine = (str) => activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPE.LINE,
            data: str
        }));
    });

    command.endLine = () => activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPE.END_LINE
        }));
    });
}

Server.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
    });
});
