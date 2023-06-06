import Server from "@fullstacked/webapp/server";
import createListener from "@fullstacked/webapp/rpc/createListener";
import Commands from "fullstacked/Commands";
import fs from "fs";
import deploy from "./deploy";
import websocket from "./websocket";
import getModuleDir from "../../../utils/getModuleDir";
import {resolve} from "path";
import {fileURLToPath} from "url";

export const server = new Server();

server.pages["/"].addInHead(`<title>FullStacked GUI</title>`);

export const api = {
    async installedCommand(){

        const commandsInfos: {
            name: string,
            version: string,
            description: string,
            installed: boolean
        }[] = [];

        for (let i = 0; i < Commands.length; i++) {
            const command = Commands[i];
            const location = await getModuleDir(`@fullstacked/${command}`);
            const infos = location
                ? JSON.parse(fs.readFileSync(resolve(fileURLToPath(location), "package.json")).toString())
                : null;
            commandsInfos.push({
                name: command,
                version: infos?.version,
                description: infos?.description,
                installed: Boolean(location)
            })
        }
        return commandsInfos;
    },
    close(){
        process.exit(0);
    },

    deploy
}

server.addListener(createListener(api));

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

// called with [npx fullstacked gui]
if(!process.argv.includes("gui"))
    server.start();

export default server.serverHTTP;

websocket(server.serverHTTP);
