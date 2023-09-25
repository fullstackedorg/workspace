import {CloudFSClient} from "./cloud-fs-client";
import {initFS} from "./init-fs";
import {execSync} from "child_process";
import {IncomingMessage} from "http";
import * as os from "os";

type CloudFSStartResponseType =
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
    string

export const CloudFS = {
    ...initFS(CloudFSClient.client.post.bind(CloudFSClient.client)),

    async sync(remoteKey: string = ""){
        // init remote rsync service
        const {id, ip, port, password} = await (await fetch(`${CloudFSClient.endpoint}/sync`, {headers: {
            cookie: this.req.headers.cookie,
            authorization: CloudFSClient.authorization
        }})).json();

        // launch rsync
        try{
            execSync(`sshpass -p ${password} rsync -rvz -e 'ssh -p ${port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' --exclude='**/node_modules/**' root@${ip}:/home/${remoteKey} ${os.homedir}`);
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

        CloudFSClient.setAuthorization(token);
    },

    setCloudFSEndpoint(endpoint){
        CloudFSClient.endpoint = endpoint;
        CloudFSClient.client.origin = CloudFSClient.endpoint;
    },

    async start(this: {req: IncomingMessage}): Promise<CloudFSStartResponseType>{
        const response = await fetch(`${CloudFSClient.endpoint}/start`, {
            headers: {
                cookie: this.req.headers.cookie,
                authorization: CloudFSClient.authorization
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
            CloudFSClient.client.origin = CloudFSClient.endpoint;
            CloudFSClient.client.headers.authorization = CloudFSClient.authorization;
            CloudFSClient.client.headers.cookie = this.req.headers.cookie;
        }

        return data;
    }
}
