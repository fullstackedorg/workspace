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
        const {id, ip, port, password} = await (await fetch(`${Sync.endpoint}/sync`, {headers: {
                cookie: this.req.headers.cookie,
                authorization: Sync.config?.authorization
            }})).json();

        try{
            await Promise.all(keys.map(key => new Promise<void>(resolve => {
                if(save)
                    Sync.addKey(key);
                const localPath = Sync.config.directory + "/" + key;
                const remotePath = `/home/${key}`.split("/").slice(0, -1).join("/");
                const rsyncProcess = exec(`sshpass -p ${password} rsync -rvz -e 'ssh -p ${port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' --exclude='**/node_modules/**' ${localPath} root@${ip}:${remotePath}`);
                rsyncProcess.on("error", data => {
                    console.log(data);
                    resolve();
                })
                rsyncProcess.on("exit", resolve);
            })));
        }catch (e) { console.log(e) }

        // stop remote rsync service
        return (await fetch(`${Sync.endpoint}/stopSync`, {
            method: "POST",
            headers: {
                cookie: this.req.headers.cookie,
                authorization: Sync.config.authorization
            },
            body: JSON.stringify({0: id})
        })).text();
    }
}
