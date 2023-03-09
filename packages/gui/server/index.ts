import Server from "@fullstacked/webapp/server"
import createHandler from "typescript-rpc/createHandler";
import Commands from "fullstacked/Commands";
import fs from "fs";
import deploy from "./deploy";

Server.port = 8001;

const api = {
    async installedCommand(){
        return Commands.map(command => ({
            ...command,
            installed: fs.existsSync(`./node_modules/@fullstacked/${command.name}/index.js`)
        }));
    },

    deploy
}

export default api;

const handler = createHandler(api);

Server.addListener("/typescript-rpc", {
    name: "typescript-rpc",
    handler
});

Server.listeners.default.pop();
Server.listeners.default.push({
    handler(req, res): any {
        if(req.url.includes(".")) {
            req.url = "/" + req.url.split("/").pop();
            Server.listeners.default.at(0).handler(req, res);
            return;
        }
        res.end(Server.pages["/"].toString());
    }
});
