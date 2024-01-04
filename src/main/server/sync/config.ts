import os from "os";
import fs from "fs";
import { DirectoryCheck, StorageSerialized, SyncInitResponse } from "./types";
import Storage from "./storage";

export default class {
    dir = process.env.MAIN_DIRECTORY;
    file = process.env.CONFIG_FILE || `${this.dir|| os.homedir()}/.fullstacked-config`;
    storages: Storage[] = [];

    set directory(dir: string) {
        const checkReponse = this.directoryCheck(dir);
        if(checkReponse){
            if(checkReponse.reason === DirectoryCheck.NOT_EXISTS)
                fs.mkdirSync(dir, {recursive: true});
            else 
                return;
        }

        this.dir = dir;
        this.save();
    };

    directoryCheck(directory: string = this.dir): SyncInitResponse & { reason: DirectoryCheck } {
        const homeDir = os.homedir();

        if(!directory){
            return {
                error: "directory",
                reason: DirectoryCheck.UNDEFINED
            }
        } 
        else if (!process.env.MAIN_DIRECTORY && (!directory.startsWith(homeDir) || homeDir.length > directory.length)) {
            return {
                error: "directory",
                reason: DirectoryCheck.NOT_UNDER_HOME
            };
        }
        else if (!fs.existsSync(directory)) {
            return {
                error: "directory",
                reason: DirectoryCheck.NOT_EXISTS
            }
        }
        else if (fs.statSync(directory).isFile()) {
            return {
                error: "directory",
                reason: DirectoryCheck.IS_FILE
            }
        }
    }

    async load(): Promise<SyncInitResponse>{
        return process.env.CLOUD_CONFIG
            ? this.loadCloud()
            : this.loadLocal();
    }

    private loadLocal(): SyncInitResponse {
        if(!fs.existsSync(this.file)) {
            return {
                error: "no_config"
            }
        }

        // make sure it's a file
        if(!fs.statSync(this.file).isFile()){
            return {
                error: "corrupt_file",
                message: "Not a file",
                filePath: this.file
            }
        }

        // let's try to JSON parse it
        const contents = fs.readFileSync(this.file).toString();
        let config: configJSON;
        try {
            config = JSON.parse(contents);
        } catch (e) {
            return {
                error: "corrupt_file",
                filePath: this.file,
                message: e.message
            }
        }

        this.dir = process.env.MAIN_DIRECTORY || config.directory;
        config.storages?.forEach(serializedStorage => Storage.addStorage(serializedStorage));
    }

    private async loadCloud(): Promise<SyncInitResponse> {
        return null
    }

    toJSON(){
        return {
            // avoid overriding MAIN_DIRECTORY at all cost
            directory: process.env.MAIN_DIRECTORY ? undefined : this.dir,

            storages: this.storages
                .filter(storage => !storage.cluster // not from cluster
                    || (storage.isCluster && storage.client.authorization) // cluster with auth
                    || storage.keys) // from cluster with keys
        }
    }

    save() {
        return process.env.CLOUD_CONFIG
            ? this.saveCloud()
            : this.saveLocal();
    }

    private saveLocal(){
        fs.writeFileSync(this.file, JSON.stringify(this, null, 2))
    }

    private saveCloud(){}
    
}

type configJSON = {
    directory: string,
    storages: StorageSerialized[]
}