import {homedir} from "os";
import fs, {existsSync} from "fs";
import {fsCloudClient} from "./fs-cloud-client";
import {SyncStatus} from "../../client/sync/status";
import {WebSocket, WebSocketServer} from "ws";

export class Sync {
    static status: SyncStatus;
    static syncInterval = 1000 * 60 * 5; // 5 minutes
    static endpoint = process.env.STORAGE_ENDPOINT || "https://auth2.fullstacked.cloud/storages";
    static config: {
        authorization?: string,
        directory?: string,
        keys?: string[]
    } = {
        directory: process.env.DOCKER_RUNTIME ? "/home" : undefined
    };
    static configFile = `${homedir()}/.fullstacked`;

    static setDirectory(directory: string) {
        Sync.config.directory = directory;
        Sync.config.keys = Sync.config.keys || [];
        Sync.saveConfigs();
    }

    static setAuthorization(token: string) {
        token = token.trim();
        Sync.config.authorization = token;
        Sync.saveConfigs();
    }

    static addKey(key: string){
        if(key === Sync.configFile) return;

        if(!Sync.config.keys)
            Sync.config.keys = [];

        Sync.config.keys.push(key);
        Sync.saveConfigs();
    }

    private static saveConfigs(){
        const stringified = JSON.stringify(Sync.config, null, 2);
        if(process.env.DOCKER_RUNTIME)
            fsCloudClient.post().writeFile(Sync.configFile, stringified);
        else
            fs.writeFileSync(Sync.configFile, stringified);
    }

    static async loadLocalConfigs(){
        let configData;
        if(process.env.DOCKER_RUNTIME){
            try{
                configData = await fsCloudClient.get().readFile(this.configFile);
            }catch (e){
                console.log(e)
            }
        }else{
            if(existsSync(Sync.configFile))
                configData = fs.readFileSync(Sync.configFile);
        }

        if(!configData) return;

        try{
            Sync.config = JSON.parse(configData.toString());
        }catch (e) { }
    }

    static webSocketServer = new WebSocketServer({noServer: true});
    static ws = new Set<WebSocket>();
    static updateStatus(status: SyncStatus){
        Sync.status = status;
        const strigified = JSON.stringify(Sync.status);
        Sync.ws.forEach(ws => ws.send(strigified));
    }
}

Sync.webSocketServer.on("connection", ws => {
    Sync.ws.add(ws);
    ws.send(JSON.stringify(Sync.status))
    ws.on("close", () => Sync.ws.delete(ws));
});

