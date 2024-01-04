import AdmZip from "adm-zip";
import Config from "./config";
import Status from "./status";
import Storage from "./storage";
import { StorageSerialized, SyncDirection, SyncInitResponse } from "./types";
import { Status as SyncStatus } from "@fullstacked/sync/constants";
import fs from "fs";
import path from "path";
import { scan } from "@fullstacked/sync/utils";

export class SyncService {
    static config: Config;
    static status: Status;

    // singleton class
    private constructor() { }

    static async initialize(): Promise<SyncInitResponse> {
        if (SyncService.status) {
            return {
                error: "already_initialized"
            }
        }

        this.config = new Config();
        Storage.addStorage = SyncService.addStorage.bind(this);

        let response: SyncInitResponse = await SyncService.config.load();
        if (response)
            return response;

        response = SyncService.config.directoryCheck();
        if (response)
            return response;

        SyncService.status = new Status();
    }

    static addStorage(storage: StorageSerialized, cluster?: string) {
        if (!SyncService.config)
            return;

        let storageInstance = this.config.storages.find(({ origin }) => storage.origin === origin);
        if (storageInstance) {
            if (cluster)
                storageInstance.cluster = cluster;

            if (storage.client?.authorization)
                storageInstance.client.authorization = storage.client.authorization;
        }
        else {
            storageInstance = new Storage(storage);
            if (cluster)
                storageInstance.cluster = cluster;

            this.config.storages.push(storageInstance);
        }

        SyncService.config.save();

        return storageInstance;
    }

    static sync(direction: SyncDirection) {
        const syncFunction = direction === SyncDirection.PUSH
            ? push
            : pull;

        SyncService.config.storages.forEach(async storage => {
            if (!storage.keys || await storage.hello())
                return;

            storage.keys.forEach(itemKey => {
                syncFunction(storage.origin, itemKey);
            });
        });
    }
}

export function getStorageByOrigin(origin: string, throwErr = true) {
    const storage = SyncService.config.storages.find(storage => storage.origin === origin);
    if (!storage && throwErr)
        throw new Error(`Cannot find storage for origin [${origin}]`);

    return storage;
}

export async function push(origin: string, itemKey: string) {
    const storage = getStorageByOrigin(origin);

    if (await storage.hello()) {
        SyncService.status.sendError(`Cannot sync to [${origin}]`);
        return;
    }

    storage.client.rsync.baseDir = SyncService.config.dir;

    SyncService.status.addSyncingKey(itemKey, SyncDirection.PUSH, origin);
    const pushPromise = storage.client.rsync.push(itemKey, {
        filters: [".gitignore"],
        exclude: [".build.zip"],
        progress(info) {
            SyncService.status.updateSyncProgress(itemKey, info)
        }
    });

    const onPushFinish = (response: SyncStatus) => {
        SyncService.status.removeSyncingKey(itemKey);
        storage.addKey(itemKey);

        SyncService.config.save();

        console.log(response);

        if (response.status === "error")
            SyncService.status.sendError(response.message);
        else if (response.status === "none")
            return;

        if (fs.statSync(path.join(SyncService.config.dir, itemKey)).isFile())
            return;

        const packageJSONs = findAllPackageJSON(SyncService.config.dir, itemKey);

        packageJSONs.forEach((packageJSON) => syncApp(packageJSON, storage));
    }

    pushPromise.then(onPushFinish);
}

export async function pull(origin: string, itemKey: string) {
    const storage = getStorageByOrigin(origin);

    if (await storage.hello()) {
        SyncService.status.sendError(`Cannot sync from [${origin}]`);
        return;
    }

    storage.client.rsync.baseDir = SyncService.config.dir;

    SyncService.status.addSyncingKey(itemKey, SyncDirection.PULL, origin);
    const pullPromise = storage.client.rsync.pull(itemKey, {
        progress(info) {
            SyncService.status.updateSyncProgress(itemKey, info)
        }
    });

    const onPullFinish = (response: SyncStatus) => {
        SyncService.status.removeSyncingKey(itemKey);
        storage.addKey(itemKey);

        SyncService.config.save();

        if (response.status === "error")
            SyncService.status.sendError(response.message);
    }

    pullPromise.then(onPullFinish);
}

function findAllPackageJSON(baseDir: string, dir: string) {
    return scan(baseDir, dir, [".gitignore"], null)
        .filter(([itemPath]) => itemPath.endsWith("/package.json"))
        .map(([packageJSONPath]) => packageJSONPath);
}

async function syncApp(packageJSON: string, storage: Storage) {
    let json: {
        name: string,
        title: string,
        icon: string,
        files: string[]
    };
    try {
        json = JSON.parse(fs.readFileSync(path.resolve(SyncService.config.dir, packageJSON)).toString());
    } catch (e) {
        SyncService.status.sendError(`Unable to parse [${packageJSON}]`);
        return;
    }

    if (!json.files)
        return;

    const title = json.title || json.name;

    const items = json.files;
    if (json.icon)
        items.push(json.icon);


    const appBaseDirectory = path.dirname(packageJSON);

    items.push(packageJSON.slice(appBaseDirectory.length + 1));

    const appBaseDirectoryAbsolute = path.resolve(SyncService.config.dir, appBaseDirectory);
    const itemOutsideOfBaseDirectory = items.find((itemKey) => {
        const itemAbsolutePath = path.resolve(SyncService.config.dir, appBaseDirectory, itemKey);
        return !itemAbsolutePath.startsWith(appBaseDirectoryAbsolute);
    })

    if (itemOutsideOfBaseDirectory) {
        SyncService.status.sendError(`Cannot sync App [${title}] because [${itemOutsideOfBaseDirectory}] is outside the app base directory`);
        return;
    }

    SyncService.status.addSyncingKey(title, SyncDirection.PUSH, storage.origin);
    const artifactPath = compress(appBaseDirectory, items);

    const pushPromise = storage.client.rsync.push(artifactPath, {
        force: true,
        progress(info) {
            SyncService.status.updateSyncProgress(title, info);
        }
    })

    const onPushFinish = (response: SyncStatus) => {
        SyncService.status.removeSyncingKey(title);

        if (response?.status === "error")
            SyncService.status.sendError(response.message)
    }

    pushPromise.then(onPushFinish);
}

function compress(appBaseDirectory: string, itemsKeys: string[]) {
    var zip = new AdmZip();

    for (const itemKey of itemsKeys) {
        const absolutePath = path.resolve(SyncService.config.dir, appBaseDirectory, itemKey);
        if (!fs.existsSync(absolutePath))
            continue;

        if (fs.statSync(absolutePath).isFile())
            zip.addLocalFile(absolutePath, "", itemKey);
        else
            zip.addLocalFolder(absolutePath, itemKey);
    }

    const outputPath = path.join(appBaseDirectory, ".build.zip");
    zip.writeZip(path.resolve(SyncService.config.dir, outputPath));

    return outputPath;
}