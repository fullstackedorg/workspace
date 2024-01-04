import Config from "./config";
import Status from "./status";
import Storage from "./storage";
import { StorageSerialized, SyncInitResponse } from "./types";

export class SyncService {
    static config: Config;
    static status: Status;

    // singleton class
    private constructor() { }

    static async initialize(): Promise<SyncInitResponse> {
        if(SyncService.status) {
            return {
                error: "already_initialized"
            }
        }

        this.config = new Config();
        Storage.addStorage = SyncService.addStorage.bind(this);

        let response: SyncInitResponse = await SyncService.config.load();
        if(response)
            return response;

        response = SyncService.config.directoryCheck();
        if(response)
            return response;
            
        SyncService.status = new Status();
    }

    static addStorage(storage: StorageSerialized, cluster?: string){
        if(!SyncService.config)
            return;

        let storageInstance = this.config.storages.find(({origin}) => storage.origin === origin);
        if(storageInstance){
            if(cluster)
            storageInstance.cluster = cluster;

            if(storage.client?.authorization)
            storageInstance.client.authorization = storage.client.authorization;
        }
        else {
            storageInstance = new Storage(storage);
            if(cluster)
                storageInstance.cluster = cluster;

            this.config.storages.push(storageInstance);
        }

        SyncService.config.save();

        return storageInstance;
    }
}