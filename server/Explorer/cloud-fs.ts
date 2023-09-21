import {CloudFSClient} from "./cloud-fs-client";
import {initFS} from "./init-fs";
import {execSync} from "child_process";
import {IncomingMessage} from "http";
import cookie from "cookie";
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

    async sync(remoteKey: string){
        const {id, ip, port, password} = await (await fetch(`${CloudFSClient.endpoint}/sync`, {headers: {authorization: CloudFSClient.authorization}})).json();
        try{
            execSync(`sshpass -p ${password} rsync -rvz -e 'ssh -p ${port} -o StrictHostKeyChecking=no' --exclude='**/node_modules/**' root@${ip}:/home/${remoteKey} ${os.homedir}`);
        }catch (e) { console.log(e) }
        return (await fetch(`${CloudFSClient.endpoint}/stopSync`, {
            method: "POST",
            headers: {authorization: CloudFSClient.authorization},
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
        const cookies = cookie.parse(this.req.headers.cookie || "");
        const authorization = cookies.token || CloudFSClient.authorization;

        const response = await fetch(`${CloudFSClient.endpoint}/start`, {headers: {authorization}})
        const dataStr = await response.text();

        let data;
        try{
            data = JSON.parse(dataStr);
        }catch (e) {
            return dataStr;
        }

        if(data === true) {
            CloudFSClient.authorization = authorization
            CloudFSClient.client.origin = CloudFSClient.endpoint;
            CloudFSClient.client.headers.authorization = authorization;
        }

        return data;
    }
}

