import fs from "fs";
import {initFS} from "./init-fs";
import {execSync} from "child_process";
import {CloudFSClient} from "./cloud-fs-client";
import * as os from "os";

export const LocalFS = {
    ...initFS(fs.promises),

    async sync(localKey: string  = ""){
        let response, id, ip, port, password;
        try{
            response = await (await fetch(`${CloudFSClient.endpoint}/sync`, {headers: {
                    cookie: this.req.headers.cookie,
                    authorization: CloudFSClient.authorization
                }})).text();

            const json = JSON.parse(response);
            id = json.id;
            ip = json.ip;
            port = json.port;
            password = json.password;
        }catch (e) {
            console.log(e, response)
        }

        try{
            execSync(`sshpass -p ${password} rsync -rvz -e 'ssh -p ${port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' --delete --exclude='**/node_modules/**' ${os.homedir()}/${localKey} root@${ip}:/home`)
        }catch (e) { console.log(e) }

        // stop remote rsync service
        return (await fetch(`${CloudFSClient.endpoint}/stopSync`, {
            method: "POST",
            headers: {
                cookie: this.req.headers.cookie,
                authorization: CloudFSClient.authorization
            },
            body: JSON.stringify({0: id})
        })).text();
    }
}
