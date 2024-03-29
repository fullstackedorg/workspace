import { homedir } from "os";
import fs, { existsSync } from "fs";
import { WebSocket } from "ws";
import { SyncStatus } from "../../client/sync/status";
import type { ProgressInfo } from "@fullstacked/sync/constants";
import { SyncClient } from "./client";

export type RemoteStorageResponseType =
    // if theres is no config file nor USE_CLOUD_CONFIG
    // don't force user into setting up Sync
    {
        error: "no_configs"
    } |
    // user needs to define a local directory to sync files
    {
        error: "directory",
        reason: string
    } |
    // user needs to authenticate with password
    {
        error: "authorization",
        type: "password"
    } |
    // needs to launch the auth flow
    {
        error: "authorization",
        type: "external",
        url: string
    } |
    // needs to launch the endpoint selection
    // for when using a cluster of storage servers
    {
        error: "endpoint_selection",
        url: string
    } |
    // when failing to JSON.parse
    {
        error: "corrupt_file",
        filePath: string
    } |
    {
        error: "storage_endpoint_unreachable",
        message?: string
    } |
    // auth is all good. proceed
    true |
    // returned unknown stuff
    string;

export class Sync {
    static status: SyncStatus;
    static syncInterval = 1000 * 60 * 2; // 2 minutes
    static config: {
        authorization?: string,
        directory?: string,
        keys?: string[]
    } = null;
    static configFile = process.env.CONFIG_FILE || `${process.env.MAIN_DIRECTORY || homedir()}/.fullstacked-config`;

    // singleton class
    private constructor() { }

    // this method pokes the Sync endpoint to check if we're in the clear
    static async hello(): Promise<RemoteStorageResponseType> {
        let response: RemoteStorageResponseType;
        try {
            const helloResponse = await fetch(`${SyncClient.fs.origin}/hello`, {
                method: "POST",
                headers: {
                    ...SyncClient.fs.headers,
                    authorization: Sync.config.authorization
                }
            });
            response = await helloResponse.text();
        } catch (e) {
            console.log(e)
            return {
                error: "storage_endpoint_unreachable",
                message: `endpoint [${SyncClient.fs.origin}] response [${response}]`
            }
        }

        try {
            response = JSON.parse(response);
        } catch (e) { }

        return response;
    }

    static setDirectory(directory: string) {
        const exists = existsSync(directory);
        const isFile = exists && fs.statSync(directory).isFile();

        if (isFile)
            return;

        if (!exists)
            fs.mkdirSync(directory, { recursive: true });

        if(!Sync.config)
            Sync.config = {};

        Sync.config.directory = directory;
        Sync.config.keys = Sync.config.keys || [];
        Sync.saveConfigs();
    }

    static setAuthorization(token: string) {
        token = token.trim();

        SyncClient.fs.headers.authorization = token;
        SyncClient.rsync.headers.authorization = token;

        Sync.config.authorization = token;
        Sync.saveConfigs();
    }

    static addKey(key: string) {
        if (!Sync.config.keys)
            Sync.config.keys = [];

        if (Sync.config.keys.includes(key)) return;

        Sync.config.keys.push(key);
        Sync.saveConfigs();
    }

    static removeKey(key: string) {
        if (!Sync.config?.keys?.includes(key)) return;

        Sync.config.keys.splice(Sync.config.keys.indexOf(key), 1);
        Sync.saveConfigs();
    }

    static async saveConfigs(retryCloudConfigSave = true) {
        if (process.env.USE_CLOUD_CONFIG) {
            const { authorization, ...configs } = Sync.config;

            // save configs to cloud config, never send authorization
            SyncClient.fs.post().writeFile(Sync.configFile, JSON.stringify(configs, null, 2))
                .catch(() => {
                    if (retryCloudConfigSave)
                        Sync.saveConfigs(false);
                    else
                        Sync.sendError("Unable to save Cloud Configs");
                });

            // save authorization locally
            if (authorization)
                fs.writeFileSync(Sync.configFile, JSON.stringify({ authorization }, null, 2));
        } else {
            if(Sync.config.directory === process.env.MAIN_DIRECTORY){
                const {directory, ...rest} = Sync.config;
                fs.writeFileSync(Sync.configFile, JSON.stringify(rest, null, 2));
            }else{
                fs.writeFileSync(Sync.configFile, JSON.stringify(Sync.config, null, 2));
            }
        }
    }

    static directoryCheck() {
        const mainDir = process.env.MAIN_DIRECTORY || homedir();

        if (!Sync.config?.directory) {
            return {
                error: "directory",
                reason: "No directory defined"
            } as const;
        } else if (!existsSync(Sync.config.directory)) {
            return {
                error: "directory",
                reason: "Does not exists"
            } as const;
        } else if (!process.env.DOCKER_RUNTIME // not in docker
            // not in home or is shorter than home dir path
            && (!Sync.config.directory.startsWith(mainDir) || mainDir.length > Sync.config.directory.length)) {
            return {
                error: "directory",
                reason: `Must be under [${mainDir}] main directory`
            } as const;
        }
    }

    // in self hosted docker
    // we store the authorization in container volume and uses sync keys from cloud
    // we never save authorization in cloud storage
    static async loadConfigs(): Promise<RemoteStorageResponseType> {

        // in iOS, we start without any config file,
        // but we start the process with the right MAIN_DIRECTORY to 
        // use.
        if(process.env.MAIN_DIRECTORY && Sync.config === null){
            Sync.config = {
                directory: process.env.MAIN_DIRECTORY
            }
        }


        if (Sync.config === null && !existsSync(Sync.configFile) && !process.env.USE_CLOUD_CONFIG) {
            return {
                error: "no_configs"
            }
        }

        let response: RemoteStorageResponseType;
        let configData = {};

        // from local
        if (existsSync(Sync.configFile) && fs.statSync(Sync.configFile).isFile()) {
            const contents = fs.readFileSync(Sync.configFile).toString();

            try {
                configData = JSON.parse(contents);
            } catch (e) {
                response = {
                    error: "corrupt_file",
                    filePath: Sync.configFile
                }
            }
        }

        // from cloud
        if (process.env.USE_CLOUD_CONFIG) {
            response = await Sync.hello();
            if (response)
                return response;

            // when first time connecting to cloud storage, 
            // file doesn't exists and fails read
            let cloudConfigs = "{}";
            try {
                cloudConfigs = (await SyncClient.fs.post().readFile(Sync.configFile)).toString();
            } catch (e) { }

            try {
                configData = {
                    ...configData,
                    ...JSON.parse(cloudConfigs)
                };
            } catch (e) {
                response = {
                    error: "corrupt_file",
                    filePath: "Cloud " + Sync.configFile
                }
            }
        }

        if (!Sync.config)
            Sync.config = {}

        Sync.config = {
            ...Sync.config,
            ...configData
        }

        return response;
    }

    static addConflicts(baseKey, conflictingKeys) {
        if (!Sync.status.conflicts)
            Sync.status.conflicts = {};

        if (!Sync.status.conflicts[baseKey])
            Sync.status.conflicts[baseKey] = {};

        conflictingKeys.forEach(fileKey => Sync.status.conflicts[baseKey][fileKey] = false);
        Sync.sendStatus();
    }

    static resolveConflict(baseKey, conflictingKey) {
        if (!Sync.status.conflicts || !Sync.status.conflicts[baseKey])
            throw Error(`Trying to resolve conflict, but cannot find base key [${baseKey}]`);

        if (Sync.status.conflicts[baseKey][conflictingKey] === undefined)
            throw Error(`Trying to resolve conflict, but cannot find key [${baseKey}] [${conflictingKey}]`);

        Sync.status.conflicts[baseKey][conflictingKey] = true;
        Sync.sendStatus();
    }

    static removeResolvedConflictKey(key) {
        if (!Sync.status.conflicts || !Sync.status.conflicts[key])
            throw Error(`Trying to remove resolved conflict, but cannot find key [${key}]`);

        const conflictingKeys = Object.keys(Sync.status.conflicts[key]);
        for (const conflictingKey of conflictingKeys) {
            if (!Sync.status.conflicts[key][conflictingKey])
                throw Error(`Trying to remove resolved conflict, but cannot because conflicting key isn't resolved [${key}] [${conflictingKey}]`);
        }

        delete Sync.status.conflicts[key];
        Sync.sendStatus();
    }

    static addSyncingKey(key: string, direction: "pull" | "push", hide: boolean = false) {
        if (Sync.status.syncing && Object.keys(Sync.status.syncing).includes(key)) {
            return false;
        }

        if (!Sync.status.syncing)
            Sync.status.syncing = {};

        Sync.status.syncing[key] = {
            direction,
            hide
        };
        Sync.sendStatus();
        return true;
    }

    // update only once every 0.1s
    static lastUpdateSyncingProgress = 0;
    static readonly updateSyncingProgressInterval = 100;
    static updateSyncingKeyProgress(key: string, info: ProgressInfo) {
        if (!Sync.status.syncing || !Sync.status.syncing[key])
            return;

        Sync.status.syncing[key].progress = info;

        const now = Date.now();
        if (now - Sync.lastUpdateSyncingProgress > Sync.updateSyncingProgressInterval) {
            Sync.sendStatus(false);
            Sync.lastUpdateSyncingProgress = now;
        }
    }

    static removeSyncingKey(key: string) {
        delete Sync.status.syncing[key];
        Sync.sendStatus()
    }

    static sendError(error: string) {
        if (!Sync.status.errors)
            Sync.status.errors = [];

        Sync.status.errors.push(error);
        Sync.sendStatus();
    }

    static ws = new Set<WebSocket>();
    static sendStatus(updateLastSync = true) {
        if (updateLastSync && Sync.status
            && (!Sync.status?.syncing || Object.keys(Sync.status.syncing).length === 0)
            && (!Sync.status?.conflicts || Object.keys(Sync.status.conflicts).length === 0)) {
            Sync.status.lastSync = Date.now();
        }

        const strigified = JSON.stringify(Sync.status);
        Sync.ws.forEach(ws => ws.send(strigified));
    }
}
