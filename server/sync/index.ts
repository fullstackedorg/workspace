import {homedir} from "os";
import fs, {existsSync} from "fs";
import {fsCloudClient} from "./fs-cloud-client";
import {SyncStatus} from "../../client/sync/status";
import {WebSocket, WebSocketServer} from "ws";

export class Sync {
    static status: SyncStatus;
    static syncInterval = 1000 * 60 * 2; // 2 minutes
    static globalIgnore = [
        ".fullstacked",
        ".fullstacked-sync",
        ".cache",
        ".npm",
        ".bun/install",
        ".vscode-server-oss",
        "node_modules"
    ]
    static transferBlockSize = 10485760; // 10 MiB
    static endpoint = process.env.STORAGE_ENDPOINT || "https://auth2.fullstacked.cloud/storages";
    static config: {
        authorization?: string,
        directory?: string,
        keys?: string[]
    } = {
        directory: process.env.DOCKER_RUNTIME ? "/home" : undefined
    };
    static configFile = process.env.CONFIG_FILE || `${homedir()}/.fullstacked`;

    static setDirectory(directory: string) {
        const exists = existsSync(directory);
        const isFile = exists && fs.statSync(directory).isFile();

        if(isFile)
            return;

        if(!exists)
            fs.mkdirSync(directory, {recursive: true});

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

        if(Sync.config.keys.includes(key)) return;

        Sync.config.keys.push(key);
        Sync.saveConfigs();
    }

    static removeKey(key: string){
        console.log(key)
        if(!Sync.config?.keys?.includes(key)) return;

        Sync.config.keys.splice(Sync.config.keys.indexOf(key), 1);
        Sync.saveConfigs();
    }

    static async saveConfigs(){
        if(process.env.USE_CLOUD_CONFIG){
            const {authorization, ...configs} = Sync.config;

            // save configs to cloud config, never send authorization
            if(fsCloudClient.origin)
                fsCloudClient.post().writeFile(Sync.configFile, JSON.stringify(configs, null, 2));

            // save authorization locally
            if(authorization)
                fs.writeFileSync(Sync.configFile, JSON.stringify({authorization}, null, 2));
        }else{
            fs.writeFileSync(Sync.configFile, JSON.stringify(Sync.config, null, 2));
        }
    }

    static async loadLocalConfigs(){
        let configData = {};

        // load local configs
        if(existsSync(Sync.configFile) && fs.statSync(Sync.configFile).isFile()){
            configData = JSON.parse(fs.readFileSync(Sync.configFile).toString());
        }

        // get config from cloud
        if(process.env.USE_CLOUD_CONFIG && fsCloudClient.origin){
            const cloudConfigs = (await fsCloudClient.get().readFile(this.configFile)).toString();
            configData = {
                ...configData,
                ...JSON.parse(cloudConfigs)
            };
        }

        if(!Sync.config)
            Sync.config = {}

        Sync.config = {
            ...Sync.config,
            ...configData
        }
    }

    // baseKey => problematic keys => resolved
    static conflicts: {
        [baseKey: string]: {
            [key: string]: boolean
        }
    } = {};

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
