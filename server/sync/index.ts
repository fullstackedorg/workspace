import {homedir} from "os";
import fs, {existsSync} from "fs";
import {fsCloudClient} from "./fs-cloud-client";
import {WebSocket, WebSocketServer} from "ws";
import {SyncStatus} from "../../client/sync/status";

export class Sync {
    static status: SyncStatus;
    static syncInterval = 1000 * 60 * 2; // 2 minutes
    static globalIgnore = [
        ".fullstacked-config",
        ".fullstacked-sync",
        ".cache",
        ".npm",
        ".bun/install",
        ".vscode-server-oss",
        "node_modules",
        "core"
    ]
    static transferBlockSize = 5242880; // 5 MiB
    static endpoint = process.env.STORAGE_ENDPOINT || "https://auth2.fullstacked.cloud/storages";
    static config: {
        authorization?: string,
        directory?: string,
        keys?: string[]
    } = {
        directory: process.env.DOCKER_RUNTIME ? "/home" : undefined
    };
    static configFile = process.env.CONFIG_FILE || `${homedir()}/.fullstacked-config`;

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
            let cloudConfigs;
            try{
                cloudConfigs = (await fsCloudClient.post().readFile(this.configFile)).toString();
                configData = {
                    ...configData,
                    ...JSON.parse(cloudConfigs)
                };
            }catch (e) { }
        }

        if(!Sync.config)
            Sync.config = {}

        Sync.config = {
            ...Sync.config,
            ...configData
        }
    }

    static addConflicts(baseKey, conflictingKeys){
       if(!Sync.status.conflicts)
           Sync.status.conflicts = {};

       if(!Sync.status.conflicts[baseKey])
           Sync.status.conflicts[baseKey] = {};

        conflictingKeys.forEach(fileKey => Sync.status.conflicts[baseKey][fileKey] = false);
        Sync.sendStatus();
    }

    static resolveConflict(baseKey, conflictingKey){
        if(!Sync.status.conflicts || !Sync.status.conflicts[baseKey])
            throw Error(`Trying to resolve conflict, but cannot find base key [${baseKey}]`);

        if(Sync.status.conflicts[baseKey][conflictingKey] === undefined)
            throw Error(`Trying to resolve conflict, but cannot find key [${baseKey}] [${conflictingKey}]`);

        Sync.status.conflicts[baseKey][conflictingKey] = true;
        Sync.sendStatus();
    }

    static removeResolvedConflictKey(key){
        if(!Sync.status.conflicts || !Sync.status.conflicts[key])
            throw Error(`Trying to remove resolved conflict, but cannot find key [${key}]`);

        const conflictingKeys = Object.keys(Sync.status.conflicts[key]);
        for(const conflictingKey of conflictingKeys){
            if(!Sync.status.conflicts[key][conflictingKey])
                throw Error(`Trying to remove resolved conflict, but cannot because conflicting key isn't resolved [${key}] [${conflictingKey}]`);
        }

        delete Sync.status.conflicts[key];
        Sync.sendStatus();
    }

    static addSyncingKey(key: string, way: "pull" | "push"){
        if(Sync.status.syncing && Object.keys(Sync.status.syncing).includes(key)){
            return false;
        }

        if(!Sync.status.syncing)
            Sync.status.syncing = {};

        Sync.status.syncing[key] = way;
        Sync.sendStatus();
        return true;
    }

    static removeSyncingKey(key: string){
        delete Sync.status.syncing[key];
        Sync.sendStatus()
    }

    static updateLargeFileProgress(key, progress, total){
        if(!Sync.status.largeFiles)
            Sync.status.largeFiles = {};

        Sync.status.largeFiles[key] = {
            progress,
            total
        }
        Sync.sendStatus();
    }

    static removeLargeFileProgress(key){
        delete Sync.status.largeFiles[key];
        Sync.sendStatus();
    }

    static webSocketServer = new WebSocketServer({noServer: true});
    static ws = new Set<WebSocket>();
    static sendStatus(){
        if(Sync.status
            && (!Sync.status?.syncing || Object.keys(Sync.status.syncing).length === 0)
            && (!Sync.status?.conflicts || Object.keys(Sync.status.conflicts).length === 0)
            && (!Sync.status?.largeFiles || Object.keys(Sync.status.largeFiles).length === 0))
        {
            Sync.status.lastSync = Date.now();
        }

        const strigified = JSON.stringify(Sync.status);
        Sync.ws.forEach(ws => ws.send(strigified));
    }
}

Sync.webSocketServer.on("connection", ws => {
    Sync.ws.add(ws);
    ws.send(JSON.stringify(Sync.status))
    ws.on("close", () => Sync.ws.delete(ws));
});
