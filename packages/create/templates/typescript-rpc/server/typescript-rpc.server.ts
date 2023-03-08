import Server from "fullstacked/server";
import createHandler from "typescript-rpc/createHandler";

const api = {
    hello(){
        return "Hello from typescript-rpc";
    }
}

export default api;

const handler = createHandler(api);

Server.listeners.unshift({
    title: "typescript-rpc",
    handler
});
