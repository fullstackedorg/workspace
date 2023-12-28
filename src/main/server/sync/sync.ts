import { homedir } from "os";
import fs from "fs";
import path from "path";
import { WebSocket } from "ws";
import { SyncStatus } from "../../client/sync/status";
import type { ProgressInfo } from "@fullstacked/sync/constants";
import { SyncClient } from "./client";

export type RemoteStorageResponseType =
    // if theres is no config file nor CLOUD_CONFIG
    // don't force user into setting up Sync
    {
        error: "no_config"
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
        error: "storages_cluster",
        endpoints: string[] | { name: string, url: string }[]
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
    static DEFAULT_STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || "https://auth.fullstacked.cloud/storages";
    static defaultSyncClient = new SyncClient(Sync.DEFAULT_STORAGE_ENDPOINT);

    static status: SyncStatus;
    static syncInterval = 1000 * 60 * 2; // 2 minutes
    static config: {
        directory?: string,
        storages?: {
            [endpoint: string]: {
                name?: string,
                client?: SyncClient,
                keys?: string[],
                cluster?: string
            }
        }
    } = null;
    static configFile = process.env.CONFIG_FILE || `${process.env.MAIN_DIRECTORY || homedir()}/.fullstacked-config`;

    // singleton class
    private constructor() { }

    static setDirectory(directory: string) {
        const exists = fs.existsSync(directory);
        const isFile = exists && fs.statSync(directory).isFile();

        if (isFile)
            return;

        if (!exists)
            fs.mkdirSync(directory, { recursive: true });

        if (!Sync.config)
            Sync.config = {};

        Sync.config.directory = directory;
        Sync.saveConfigs();
    }

    static getSyncClient(origin: string) {
        if(origin === Sync.defaultSyncClient.fs.origin)
            return Sync.defaultSyncClient;

        if (!Sync.config.storages || !Sync.config.storages[origin]) 
            return null;

        return Sync.config.storages[origin].client;
    }

    static setAuthorization(origin: string, token: string) {
        token = token.trim();

        const syncClient = Sync.getSyncClient(origin);

        if (!Sync.config.storages)
            Sync.config.storages = {};

        if (!Sync.config.storages[origin])
            Sync.config.storages[origin] = {};

        if (!syncClient)
            Sync.config.storages[origin].client = new SyncClient(origin);

        syncClient.authorization = token;
        Sync.config.storages[origin].client = syncClient;

        Sync.saveConfigs();
    }

    static setStorageName(origin: string, name: string){
        if (!Sync.config.storages)
            Sync.config.storages = {};

        if (!Sync.config.storages[origin])
            Sync.config.storages[origin] = {};

        Sync.config.storages[origin].name = name;

        Sync.saveConfigs();
    }

    static addKey(origin: string, key: string) {
        if (!Sync.config.storages)
            Sync.config.storages = {};

        if (!Sync.config.storages[origin])
            Sync.config.storages[origin] = {};

        if (!Sync.config.storages[origin].keys)
            Sync.config.storages[origin].keys = []

        Sync.config.storages[origin].keys.push(key);

        Sync.saveConfigs();
    }

    static removeKey(key: string) {
        if (!Sync.config?.storages[origin]
            || !Sync.config.storages[origin].keys?.includes(key)) {
            return;
        }

        const indexOf = Sync.config.storages[origin].keys.indexOf(key);
        Sync.config.storages[origin].keys.splice(indexOf, 1);

        Sync.saveConfigs();
    }

    static async saveConfigs(retryCloudConfigSave = true) {

        // save to a cloud
        if (process.env.CLOUD_CONFIG) {

        }
        // save locally
        else {
            fs.writeFileSync(Sync.configFile, JSON.stringify(Sync.config || {}, null, 2));
        }
    }

    static directoryCheck() {
        const mainDir = process.env.MAIN_DIRECTORY || homedir();

        if (!Sync.config?.directory) {
            return {
                error: "directory",
                reason: "No directory defined"
            } as const;
        } else if (!fs.existsSync(Sync.config.directory)) {
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

    private static loadConfigLocal(): RemoteStorageResponseType {
        const exists = fs.existsSync(Sync.configFile);

        if (Sync.config === null) {

            // in iOS, we start without any config file,
            // but we start the process with the right MAIN_DIRECTORY to 
            // use.
            if (process.env.MAIN_DIRECTORY) {
                Sync.config = {
                    directory: process.env.MAIN_DIRECTORY
                }
            }

            // no file at all
            else if(!exists) {
                return {
                    error: "no_config"
                }
            }
        }

        // make sure it's a file
        const isFile = fs.statSync(Sync.configFile).isFile();
        if(!isFile){
            return {
                error: "corrupt_file",
                filePath: Sync.configFile
            }
        }

        // let's try to JSON parse it
        const contents = fs.readFileSync(Sync.configFile).toString();
        try {
            Sync.config = JSON.parse(contents);
        } catch (e) {
            return {
                error: "corrupt_file",
                filePath: Sync.configFile
            }
        }

        // init all of our storage clients
        if(Sync.config.storages) {
            Object.entries(Sync.config.storages).forEach(([origin, storage]) => {
                const authorization = Sync.config.storages[origin].client?.authorization;

                Sync.config.storages[origin] = {
                    ...storage,
                    client: new SyncClient(origin)
                }

                if(authorization)
                    Sync.config.storages[origin].client.authorization = authorization
            })
        }
    }

    private static loadConfigCloud(): Promise<RemoteStorageResponseType> {
        return null;
    }

    static async loadConfigs(): Promise<RemoteStorageResponseType> {
        return process.env.CLOUD_CONFIG
            ? this.loadConfigCloud()
            : this.loadConfigLocal();
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