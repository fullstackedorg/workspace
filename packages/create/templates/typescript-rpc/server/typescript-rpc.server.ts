import Server from "@fullstacked/webapp/server"
import createHandler from "typescript-rpc/createHandler";

const api = {
    helloWorld(){
        return "Hello World";
    }
}

export default api;

const handler = createHandler(api);

Server.addListener("/typescript-rpc", {
    name: "typescript-rpc",
    handler
});
