import {fsInit} from "./fs-init";
import {exec} from "child_process";
import {IncomingMessage} from "http";
import {existsSync} from "fs";
import {homedir} from "os";
import {Sync} from "./index";
import {fsCloudClient} from "./fs-cloud-client";

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


export const fsCloud = {
    ...fsInit(fsCloudClient.post.bind(fsCloudClient), () => "/home"),

    // pull files from cloud
    async sync(keys: string[], save = true): Promise<CloudFSStartResponseType>{
        // if you simply have no configs at all, abort
        if(!Sync.config.directory && !Sync.config.keys && !Sync.config.authorization)
            return null;

        // dir check before launching rsync
        const dirCheck = directoryCheck();
        if(dirCheck)
            return dirCheck;

        // init remote rsync service
        const startResponseStr = await (await fetch(`${Sync.endpoint}/sync`, {headers: {
            cookie: this.req.headers.cookie,
            authorization: Sync.config?.authorization
        }})).text();

        let startResponse: {id: string, ip: string, port: string, password:string};
        try{
            startResponse = JSON.parse(startResponseStr)
        }catch (e) {
            return startResponseStr;
        }

        if(!startResponse.id || !startResponse.ip || !startResponse.port || !startResponse.password)
            return startResponse as unknown as CloudFSStartResponseType;

        // launch rsync
        try{
            await Promise.all(keys.map(key => new Promise<void>(resolve => {
                if(save)
                    Sync.addKey(key);
                const localPath = (Sync.config.directory + "/" + key).split("/").slice(0, -1).join("/");
                const remotePath = `/home/${key}`;
                const rsyncProcess = exec(`sshpass -p ${startResponse.password} rsync -rvz -e 'ssh -p ${startResponse.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' --exclude='**/node_modules/**' root@${startResponse.ip}:${remotePath} ${localPath}`);
                rsyncProcess.on("error", data => {
                    console.log(data);
                    resolve();
                })
                rsyncProcess.on("exit", resolve);
            })));
        }catch (e) { console.log(e) }

        // stop remote rsync service
        const stopResponseStr = await (await fetch(`${Sync.endpoint}/stopSync`, {
            method: "POST",
            headers: {
                cookie: this.req.headers.cookie,
                authorization: Sync.config?.authorization
            },
            body: JSON.stringify({0: startResponse.id})
        })).text();

        try{
            return JSON.parse(stopResponseStr);
        }catch (e) {
            return stopResponseStr;
        }
    },

    async authenticate(data: any){
        let token;
        try{
            token = await (await fetch(data.url, {
                method: "POST",
                body: JSON.stringify(data)
            })).text()
        }catch (e) {
            console.log(e)
        }

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
