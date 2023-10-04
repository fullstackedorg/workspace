import {fsInit} from "./fs-init";
import {IncomingMessage} from "http";
import fs, {existsSync} from "fs";
import {homedir} from "os";
import {Sync} from "./index";
import {fsCloudClient} from "./fs-cloud-client";
import {join, resolve} from "path";
import {createSnapshot, getSnapshotDiffs} from "./utils";

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
        const syncFilePath = resolve(getLocalBaseDir(), key, ".fullstacked-sync");
        let remoteVersion;

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

            if(fs.existsSync(syncFilePath)){
                const { version, ...previousSnapshot } = JSON.parse(fs.readFileSync(syncFilePath).toString());
                const subFileKeys = (await fs.promises.readdir(resolve(getLocalBaseDir(), key), {recursive: true}))
                    .filter(subKey => !fs.lstatSync(resolve(getLocalBaseDir(), key, subKey)).isDirectory())
                const currentSnapshot = await createSnapshot(resolve(getLocalBaseDir(), key), subFileKeys);

                const snapshotsDiffs = getSnapshotDiffs(previousSnapshot, currentSnapshot)
                    // remove resolved one
                    .filter(fileKey => !(Sync.conflicts[key] && Sync.conflicts[key][fileKey]));

                if(snapshotsDiffs.length){

                    if(!Sync.conflicts[key])
                        Sync.conflicts[key] = {};

                    snapshotsDiffs.forEach(fileKey => Sync.conflicts[key][fileKey] = false);
                    return;
                }
            }

            remoteVersion = syncStart.version;
        }


        const subKeys = (await fsCloudClient.get().readdir(key, {recursive: true, withFileTypes: true}));

        const subDirectories = subKeys.filter(subKey => subKey.isDirectory).map(({ path, name}) => join(path, name));
        const subFiles = subKeys
            .map(({path, name}) => join(path, name))
            .filter(subKey => !subDirectories.includes(subKey) && !subKey.endsWith(".fullstacked-sync"))
            // remove conflicts that has been resolved manually
            .filter(fileKey => !(Sync.conflicts[key] && Sync.conflicts[key][fileKey.slice(key.length + 1)]));


        await fs.promises.mkdir(resolve(getLocalBaseDir(), key), {recursive: true});

        await Promise.all(subDirectories.map(subDir => fs.promises.mkdir(resolve(getLocalBaseDir(), subDir), {recursive: true})));

        await Promise.all(subFiles.map(subFile => new Promise<void>(async res => {
            const filePath = resolve(getLocalBaseDir(), subFile);
            const content = await fsCloudClient.get().readFile(subFile);
            await fs.promises.writeFile(filePath, content);
            res();
        })));

        if(!save)
            return;

        const filesKeys = subFiles.map(subFile => subFile.slice(key.length + 1));
        const snapshot = {
            version: remoteVersion,
            ...await createSnapshot(resolve(getLocalBaseDir(), key), filesKeys)
        };

        Sync.addKey(key);

        if(Sync.conflicts[key]) {
            delete Sync.conflicts[key];
            if(Object.keys(Sync.conflicts).length === 0) {
                Sync.updateStatus({
                    status: "synced",
                    lastSync: Date.now()
                })
            }
        }

        return fs.promises.writeFile(syncFilePath, JSON.stringify(snapshot));
    },

    async authenticate(data: any){
        let token;
        try{
            token = await (await fetch(data.url, {
                method: "POST",
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
