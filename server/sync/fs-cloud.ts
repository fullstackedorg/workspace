import {fsInit} from "./fs-init";
import {IncomingMessage} from "http";
import fs, {existsSync} from "fs";
import {homedir} from "os";
import {Sync} from "./index";
import {fsCloudClient} from "./fs-cloud-client";
import {join, resolve} from "path";
import {createSnapshot, getSnapshotDiffs, normalizePath, walkAndIgnore} from "./utils";
import prettyBytes from "pretty-bytes";

type CloudFSStartResponseType =
    // missing dependencies on local machine to run CloudFS operations
    {
        error: "dependencies",
        text: string
    } |
    // user needs to define a local directory to sync files
    {
        error: "directory",
        reason: string
    } |
    // needs to launch the auth flow
    {
        error: "authorization",
        url: string
    } |
    // needs to launch the endpoint selection
    {
        error: "endpoint_selection",
        url: string
    } |
    // auth is all good. proceed
    true |
    // returned unknown stuff
    string;

const getLocalBaseDir = () => Sync.config?.directory || homedir()

export const fsCloud = {
    ...fsInit(fsCloudClient.post.bind(fsCloudClient), () => "./"),

    // pull files from cloud
    async sync(key: string, save = true) {
        // already trying to do something
        if(Sync.status.syncing && Sync.status.syncing[key])
            return;

        if(Sync.status.conflicts && Sync.status.conflicts[key]) {
            const foundUnresolved = Object.keys(Sync.status.conflicts[key]).find(conflictingKey => !Sync.status.conflicts[key][conflictingKey])
            if(foundUnresolved) {
                Sync.sendStatus();
                return;
            }
        }

        // make sure we are authorized, and get remote version for key
        let response, syncStart;
        try {
            response = await fetch(`${Sync.endpoint}/sync`, {
                method: "POST",
                body: JSON.stringify({
                    0: key
                }),
                headers: {
                    cookie: this.req.headers.cookie,
                    authorization: Sync.config?.authorization
                }}
            )
            syncStart = await response.json();
        }catch(e){
            Sync.status.errors.push(e.message);
            Sync.sendStatus();
            return;
        }

        if(response.status >= 400 || syncStart?.version === undefined){
            throw Error(`[pull] Could not get remote version for key [${key}]`);
        }

        // make sure key exists
        try{
            await fsCloudClient.post().access(key);
        }catch (e) {
            Sync.status.errors.push(`Key [${key}] does not exists on remote`);
            Sync.sendStatus();
            return;
        }

        const syncFilePath = resolve(getLocalBaseDir(), key, ".fullstacked-sync");
        const remoteVersion = syncStart.version;

        if(fs.existsSync(syncFilePath)){
            const { version, ...previousSnapshot } = JSON.parse(fs.readFileSync(syncFilePath).toString());

            if(remoteVersion === version){
                return;
            }

            const subFileKeys = walkAndIgnore(getLocalBaseDir(), key)
                .filter(subKey => !fs.lstatSync(resolve(getLocalBaseDir(), key, subKey)).isDirectory())
            const currentSnapshot = await createSnapshot(resolve(getLocalBaseDir(), key), subFileKeys);

            const snapshotsDiffs = getSnapshotDiffs(previousSnapshot, currentSnapshot).diffs
                // remove resolved conflicts
                .filter(fileKey => !(Sync.status.conflicts && Sync.status.conflicts[key] && Sync.status.conflicts[key][fileKey]));

            if(snapshotsDiffs.length){
                Sync.addConflicts(key, snapshotsDiffs);
                return;
            }
        }

        if(!Sync.addSyncingKey(key, "pull")){
            return;
        }

        const subKeys = (await fsCloudClient.post().readdir(key, {recursive: true, withFileTypes: true}));

        const subDirectories = subKeys
            .filter(subKey => subKey.isDirectory)
            .map(({ path, name}) => normalizePath(join(path, name)));

        const subFiles = subKeys
            .map(({path, name}) => normalizePath(join(path, name)))
            .filter(subKey => !subDirectories.includes(subKey) && !subKey.endsWith(".fullstacked-sync"))
            // remove conflicts that has been resolved
            // we won't pull the previously conflicting ones
            .filter(fileKey => !(Sync.status.conflicts && Sync.status.conflicts[key] && Sync.status.conflicts[key][fileKey.slice(key.length + 1)]));

        await fs.promises.mkdir(resolve(getLocalBaseDir(), key), {recursive: true});

        await Promise.all(subDirectories.map(subDir => fs.promises.mkdir(resolve(getLocalBaseDir(), subDir), {recursive: true})));

        const lstatMulti = fsCloudClient.multi();
        subFiles.forEach(subFile => lstatMulti.add().lstat(subFile));
        const lstats = await lstatMulti.fetch();

        let payloadSize = 0;
        let readFileMulti = fsCloudClient.multi();
        const multiFetchPromises = [];
        const smallFiles = [];
        const largeFiles = [];
        subFiles.forEach((subFile, index) => {
            const filePath = resolve(getLocalBaseDir(), subFile);
            const contentLength = lstats[index].size;

            if(contentLength <= Sync.transferBlockSize) {

                if(payloadSize < Sync.transferBlockSize) {
                    payloadSize += contentLength;
                } else {
                    multiFetchPromises.push(readFileMulti.fetch());
                    readFileMulti = fsCloudClient.multi();
                    payloadSize = contentLength;
                }

                smallFiles.push(filePath);
                readFileMulti.add(true).readFile(subFile);
                return;
            }

            // large file
            const promise = new Promise<void>(async resolve => {
                const parts = Math.ceil(contentLength / Sync.transferBlockSize);
                for (let i = 0; i < parts; i++) {
                    Sync.updateLargeFileProgress(subFile, i * Sync.transferBlockSize, contentLength);

                    const bufferPart = await fsCloudClient.post(true).readFilePart(subFile, i * Sync.transferBlockSize, (i + 1) * Sync.transferBlockSize)
                    if(i === 0)
                        await fs.promises.writeFile(filePath, Buffer.from(bufferPart))
                    else
                        await fs.promises.appendFile(filePath, Buffer.from(bufferPart))
                }
                Sync.removeLargeFileProgress(subFile);
                resolve();
            });
            largeFiles.push(promise);
        });

        multiFetchPromises.push(readFileMulti.fetch());
        const contents = (await Promise.allSettled(multiFetchPromises)).map(promiseSettled => {
            if(promiseSettled.status === "rejected"){
                throw Error("Failed a multi readFile");
            }
            return promiseSettled.value
        }).flat();

        const writeFilePromises = contents.map((content, index) => {
            if(content.error){
                return false;
            }

            const filePath = smallFiles[index];
            return fs.promises.writeFile(filePath, Buffer.from(content));
        });

        const results = await Promise.allSettled([
            ...writeFilePromises.filter(Boolean),
            ...largeFiles
        ]);

        if(results.find(promiseSettled => promiseSettled.status === "rejected")){
            throw Error("Failed a local file write or large file transfer");
        }

        const filesKeys = subFiles.map(subFile => subFile.slice(key.length + 1));
        const snapshot = {
            version: remoteVersion,
            ...await createSnapshot(resolve(getLocalBaseDir(), key), filesKeys)
        };

        if(save)
            Sync.addKey(key);

        if(Sync.status.conflicts && Sync.status.conflicts[key]) {
            Sync.removeResolvedConflictKey(key);
        }

        Sync.removeSyncingKey(key);

        return fs.promises.writeFile(syncFilePath, JSON.stringify(snapshot));
    },

    async authenticate(this: {req: IncomingMessage}, data: any){
        let token;
        try{
            token = await (await fetch(data.url, {
                method: "POST",
                headers: {
                    "user-agent": this.req.headers["user-agent"]
                },
                body: JSON.stringify(data)
            })).text()
        }catch (e) { console.log(e) }

        fsCloudClient.headers.authorization = token;
        Sync.setAuthorization(token);
    },

    setDirectory(directory: string) {
        Sync.setDirectory(directory);
    },

    setEndpoint(endpoint: string){
        Sync.endpoint = endpoint;
        fsCloudClient.origin = endpoint;
    },

    async start(this: {req: IncomingMessage}): Promise<CloudFSStartResponseType>{
        const dirCheck = directoryCheck();
        if(dirCheck)
            return dirCheck;

        const response = await fetch(`${Sync.endpoint}/start`, {
            headers: {
                cookie: this.req.headers.cookie,
                authorization: Sync.config?.authorization
            }
        });
        const dataStr = await response.text();

        let data;
        try{
            data = JSON.parse(dataStr);
        }catch (e) {
            return dataStr;
        }

        if(data === true) {
            fsCloudClient.origin = Sync.endpoint;
            fsCloudClient.headers.authorization = Sync.config?.authorization;
            fsCloudClient.headers.cookie = this.req.headers.cookie;
        }

        return data;
    }
}

function directoryCheck(){
    if(!Sync.config?.directory){
        return {
            error: "directory",
            reason: "No directory defined"
        } as const;
    }else if(!existsSync(Sync.config.directory)){
        return {
            error: "directory",
            reason: "Does not exists"
        } as const;
    }else if(!process.env.DOCKER_RUNTIME // not in docker
        // not in home or is shorter than home dir path
        && (!Sync.config.directory.startsWith(homedir()) || homedir().length >= Sync.config.directory.length)){
        return {
            error: "directory",
            reason: `Must be under home [${homedir()}] directory`
        } as const;
    }
}
