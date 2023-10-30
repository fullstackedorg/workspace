import fs from "fs";
import {fsInit} from "./fs-init";
import {homedir} from "os";
import {Sync} from "./index";
import {resolve} from "path";
import {fsCloudClient} from "./fs-cloud-client";
import {createSnapshot, getSnapshotDiffs, walkAndIgnore} from "./utils";
import {fsCloud} from "./fs-cloud";
import prettyBytes from "pretty-bytes";

const getBaseDir = () => Sync.config?.directory || homedir();

export const fsLocal = {
    ...fsInit(fs.promises, getBaseDir),

    resolveConflict(baseKey: string, key: string, contents: string){
        const filePath = resolve(getBaseDir(), baseKey, key);
        fs.writeFileSync(filePath, contents);
        Sync.conflicts[baseKey][key] = true;
        return fsCloud.sync.bind(this)(baseKey, false);
    },

    // push files to cloud
    async sync(key: string, save = true){
        // make sure key exists
        if(!fs.existsSync(resolve(getBaseDir(), key)))
            return;

        const syncFilePath = resolve(getBaseDir(), key, ".fullstacked-sync");
        let localVersion;

        // version check
        let syncStart;
        try{
            syncStart = await (await fetch(`${Sync.endpoint}/sync`, {
                method: "POST",
                body: JSON.stringify({
                    0: key
                }),
                headers: {
                    cookie: this.req.headers.cookie,
                    authorization: Sync.config?.authorization
                }}
            )).json();
        } catch(e) {
            Sync.updateStatus({
                status: "error",
                message: e.message
            });
            return;
        }
        

        let previousSnapshotWithVersion;
        if(fs.existsSync(syncFilePath)){
            previousSnapshotWithVersion = JSON.parse(fs.readFileSync(syncFilePath).toString());
        }

        localVersion = previousSnapshotWithVersion?.version || 0;

        if(syncStart.version && syncStart.version !== localVersion) {
            await fsCloud.sync.bind(this)(key, save);
            return;
        }

        const subKeys = walkAndIgnore(getBaseDir(), key);

        const subDirectories = subKeys.filter(subKey => fs.lstatSync(resolve(getBaseDir(), key, subKey)).isDirectory());
        const subFiles = subKeys.filter(subKey => !subDirectories.includes(subKey) && !subKey.endsWith(".fullstacked-sync"));

        if(previousSnapshotWithVersion){
            const {version, ...previousSnapshot} = previousSnapshotWithVersion;
            const currentSnapshot = await createSnapshot(resolve(getBaseDir(), key), subFiles);

            const {
                missingInA, // new
                missingInB, // deleted
                diffs// modified
            } = getSnapshotDiffs(previousSnapshot, currentSnapshot);
            if(!missingInA.length && !missingInB.length && !diffs.length){
                return;
            }
        }

        Sync.keysSyncing.add(key);
        Sync.updateStatus({
            status: "syncing",
            keys: Array.from(Sync.keysSyncing)
        });

        await fsCloudClient.post().mkdir(key, {recursive: true});

        const mkdirMulti = fsCloudClient.multi();
        subDirectories.forEach(subDir => mkdirMulti.add().mkdir(`${key}/${subDir}`, {recursive: true}));
        await mkdirMulti.fetch();

        let writeFileMulti = fsCloudClient.multi();
        let payloadSize = 0;
        const multiFetchPromises = [];
        const largeFiles = [];
        subFiles.forEach(subFile => {
            let contents: Buffer;
            try {
                contents = fs.readFileSync(resolve(getBaseDir(), key, subFile));
            }catch (e){
                console.log(resolve(getBaseDir(), key, subFile));
                throw e;
            }

            if(contents.byteLength <= Sync.transferBlockSize) {

                if(payloadSize < Sync.transferBlockSize){
                    payloadSize += contents.byteLength;
                }else{
                    multiFetchPromises.push((writeFileMulti.fetch()))
                    payloadSize = contents.byteLength;
                    writeFileMulti = fsCloudClient.multi();
                }

                writeFileMulti.add().writeFile(`${key}/${subFile}`, contents);
                return;
            }

            // large files
            const promise = new Promise<void>(async resolve => {
                const parts = Math.ceil(contents.byteLength / Sync.transferBlockSize);

                for (let i = 0; i < parts; i++) {
                    Sync.updateStatus({
                        status: "large-file",
                        message: `[${key}/${subFile} ${prettyBytes(contents.byteLength)}] ${(i * Sync.transferBlockSize / contents.byteLength * 100).toFixed(2)}%`
                    });

                    const bufferPart = contents.subarray(i * Sync.transferBlockSize, (i + 1) * Sync.transferBlockSize);
                    // write first part
                    if(i === 0){
                        await fsCloudClient.post().writeFile(`${key}/${subFile}`, bufferPart);
                    }
                    // append other parts
                    else{
                        await fsCloudClient.post().appendFile(`${key}/${subFile}`, bufferPart);
                    }
                }

                resolve();
            });
            largeFiles.push(promise);
        });

        multiFetchPromises.push(writeFileMulti.fetch());
        await Promise.all([
            Promise.all(multiFetchPromises),
            Promise.all(largeFiles)
        ]);

        await (await fetch(`${Sync.endpoint}/pushDone`, {
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

        if(save)
            Sync.addKey(key);

        Sync.keysSyncing.delete(key);

        if(Sync.keysSyncing.size === 0){
            Sync.updateStatus({
                status: "synced",
                lastSync: Date.now()
            });
        }
    }
}
