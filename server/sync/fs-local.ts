import fs from "fs";
import {fsInit} from "./fs-init";
import {homedir} from "os";
import {Sync} from "./index";
import {join, resolve} from "path";
import {fsCloudClient} from "./fs-cloud-client";
import {createSnapshot, walkAndIgnore} from "./utils";
import {fsCloud} from "./fs-cloud";

const getBaseDir = () => Sync.config?.directory || homedir();

export const fsLocal = {
    ...fsInit(fs.promises, getBaseDir),

    resolveConflict(baseKey: string, key: string, contents: string){
        const filePath = resolve(getBaseDir(), baseKey, key);
        fs.writeFileSync(filePath, contents);
        Sync.conflicts[baseKey][key] = true;
        return fsCloud.sync.bind(this)(baseKey);
    },

    // push files to cloud
    async sync(key: string, save = true){
        const syncFilePath = resolve(getBaseDir(), key, ".fullstacked-sync");
        let localVersion;

        // version check
        if(save){
            const syncStart = await (await fetch(`${Sync.endpoint}/sync`, {
                method: "POST",
                body: JSON.stringify({
                    0: key
                }),
                headers: {
                    cookie: this.req.headers.cookie,
                    authorization: Sync.config?.authorization
                }}
            )).json();

            let previousSnapshot;
            if(fs.existsSync(syncFilePath)){
                previousSnapshot = JSON.parse(fs.readFileSync(syncFilePath).toString());
            }

            localVersion = previousSnapshot?.version || 0;

            if(syncStart.version !== localVersion) {
                // TODO: pull needed here
                console.log("Version mismatch");
                return;
            }
        }

        const subKeys = walkAndIgnore(join(getBaseDir(), key));

        await fsCloudClient.post().mkdir(key, {recursive: true});

        const subDirectories = subKeys.filter(subKey => fs.lstatSync(resolve(getBaseDir(), key, subKey)).isDirectory());
        const subFiles = subKeys.filter(subKey => !subDirectories.includes(subKey) && !subKey.endsWith(".fullstacked-sync"));

        await Promise.all(subDirectories.map(subDir => fsCloudClient.post().mkdir(`${key}/${subDir}`, {recursive: true})));
        await Promise.all(subFiles.map(subFile => fsCloudClient.post().writeFile(`${key}/${subFile}`, fs.readFileSync(resolve(getBaseDir(), key, subFile)).toString())));

        if(!save)
            return;

        const syncDone = await (await fetch(`${Sync.endpoint}/pushDone`, {
            method: "POST",
            body: JSON.stringify({
                0: key
            }),
            headers: {
                cookie: this.req.headers.cookie,
                authorization: Sync.config?.authorization
            }}
        )).text();

        fs.writeFileSync(syncFilePath, JSON.stringify({...(await createSnapshot(resolve(getBaseDir(), key), subFiles)), version: localVersion + 1}));

        Sync.addKey(key);
    }
}
