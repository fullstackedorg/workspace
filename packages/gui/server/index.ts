import Server from "@fullstacked/webapp/server"
import createHandler from "typescript-rpc/createHandler";
import Commands from "fullstacked/Commands";
import fs from "fs";
import deploy from "./deploy";
import CLIParser from "fullstacked/utils/CLIParser";
import {fileURLToPath} from "url";
import { dirname } from "path";
import websocket from "./websocket";

const server = new Server();

const {port} = CLIParser.getCommandLineArgumentsValues({
    port: {
        type: "number",
        default: 8001
    }
});

server.port = port;

setTimeout(async () => {
    try{
        global.__dirname = fileURLToPath(dirname(import.meta.url));
        const open = (await import("open")).default;
        open(`http://localhost:${port}`);
    }catch (e) {}
}, 1000);

server.pages["/"].addInHead(`<title>FullStacked GUI</title>`);

export const api = {
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

const handler = createHandler(api);

server.addListener("/typescript-rpc", {
    name: "typescript-rpc",
    handler
});

const lastListener = server.listeners.default.pop();
server.listeners.default.push({
    handler(req, res): any {
        if(req.url.includes(".")) {
            req.url = "/" + req.url.split("/").pop();
            server.listeners.default.at(0).handler(req, res);
            return;
        }

        res.setHeader("content-type", "text/html")
        res.writeHead(200);
        res.end(server.pages["/"].toString());
    }
}, lastListener);

server.start();

export default server.serverHTTP;

websocket(server.serverHTTP);
