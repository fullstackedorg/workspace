import open from "open";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { Listener } from "@fullstacked/webapp/server";

// Basic api methods
export default class extends BackendTool {
    api = {
        ping: () => Date.now(),

        openBrowserNative(url: string) {
            open(url);
        },

        // check if forced port, or is not in docker
        // meaning we can directly go to http://localhost:XXXX
        //
        // maybe this could be handled in the client
        usePort() {
            return process.env.FORCE_PORT_USAGE === "1" || process.env.DOCKER_RUNTIME !== "1";
        }
    };

    listeners: (Listener & { prefix?: string; })[];
    websocket: WebSocketRegisterer;

}