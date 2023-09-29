import fs from "fs";
import {fsInit} from "./fs-init";
import {exec} from "child_process";
import {homedir} from "os";
import {Sync} from "./index";

export const fsLocal = {
    ...fsInit(fs.promises, () => Sync.config?.directory || homedir()),

    // push files to cloud
    async sync(keys: string[], save = true){
        // init remote rsync service
        const startResponseStr = await (await fetch(`${Sync.endpoint}/sync`, {headers: {
                cookie: this.req.headers.cookie,
                authorization: Sync.config?.authorization
            }})).text();

        let startResponse: {id: string, ip: string, port: string, password:string};
        try{
            startResponse = JSON.parse(startResponseStr)
        }catch (e) {
            console.log(startResponseStr);
            return startResponseStr;
        }

        if(!startResponse.id || !startResponse.ip || !startResponse.port || !startResponse.password)
            return startResponse;

        try{
            await Promise.all(keys.map(key => new Promise<void>(resolve => {
                if(save)
                    Sync.addKey(key);
                const localPath = Sync.config.directory + "/" + key;
                const remotePath = `/home/${key}`.split("/").slice(0, -1).join("/");
                const rsyncProcess = exec(`sshpass -p ${startResponse.password} rsync -rvz -e 'ssh -p ${startResponse.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' --exclude='**/node_modules/**' ${localPath} root@${startResponse.ip}:${remotePath}`);
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
            console.log(stopResponseStr);
            return stopResponseStr;
        }
    }
}
