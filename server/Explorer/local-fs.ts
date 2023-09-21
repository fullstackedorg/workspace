import fs from "fs";
import {initFS} from "./init-fs";
import {execSync} from "child_process";
import {CloudFSClient} from "./cloud-fs-client";
import * as os from "os";

export const LocalFS = {
    ...initFS(fs.promises),

    async sync(localKey: string){
        const {id, ip, port, password} = await (await fetch(`${CloudFSClient.endpoint}/sync`, {headers: {authorization: CloudFSClient.authorization}})).json();
        try{
            execSync(`sshpass -p ${password} rsync -rvz -e 'ssh -p ${port} -o StrictHostKeyChecking=no' --exclude='**/node_modules/**' ${os.homedir()}/${localKey} root@${ip}:/home`)
        }catch (e) { console.log(e) }
        return (await fetch(`${CloudFSClient.endpoint}/stopSync`, {
            method: "POST",
            headers: {authorization: CloudFSClient.authorization},
            body: JSON.stringify({0: id})
        })).text();
    }
}
