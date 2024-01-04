import { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../backend";

export default class extends BackendTool {
    api = {
        listApps: async () => {
        }
    };
    listeners: (Listener & { prefix?: string; })[] = [{
        prefix: "/share",
        handler(req, res) {
            
        }
    }];
    websocket: WebSocketRegisterer;
    
}