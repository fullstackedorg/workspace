import { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { listRemoteApps } from "../../../lite/server/apps";

export default class extends BackendTool {
    api = {
        listApps: async () => {
            const apps = await listRemoteApps();
            return apps.map(([packageJSON]) => packageJSON);
        }
    };
    listeners: (Listener & { prefix?: string; })[] = [{
        prefix: "/share",
        handler(req, res) {
            
        }
    }];
    websocket: WebSocketRegisterer;
    
}