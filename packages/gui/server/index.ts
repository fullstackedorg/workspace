import Server from "@fullstacked/webapp/server"
import createHandler from "typescript-rpc/createHandler";

const api = {
    async currentDir(){
        return process.cwd();
    }
}

export default api;

const handler = createHandler(api);

Server.addListener("/typescript-rpc", {
    name: "typescript-rpc",
    handler
});

Server.port = 8000;