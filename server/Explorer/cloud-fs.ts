import {CloudFSClient} from "./cloud-fs-client";
import {initFS} from "./init-fs";
import fs from "fs";
import {homedir} from "os";

export const CloudFS = {
    ...initFS(CloudFSClient.client.post.bind(CloudFSClient.client)),

    authAppEndpoint(){
        return process.env.AUTH_APP || "https://fullstacked.cloud";
    },

    async hasAuth(){
        if(!fs.existsSync(`${homedir()}/.fullstacked`))
            return false;

        const token = fs.readFileSync(`${homedir()}/.fullstacked`).toString();

        let response;
        try{
            response = await fetch(CloudFSClient.authEndpoint, {
                headers: {authorization: token}
            });
        }catch (e) {
            console.log(e, "cloud-fs-auth")
            return false;
        }

        if(response.status >= 400 || !await response.text())
            return false;

        CloudFSClient.setAuthToken(token);
        return true;
    },

    async authenticate(data: any){
        let token;
        try{
            token = await (await fetch(CloudFSClient.authEndpoint, {
                method: "POST",
                body: JSON.stringify(data)
            })).text()
        }catch (e) {
            console.log(e)
        }

        if(token){
            CloudFSClient.setAuthToken(token);
        }

        return !!token;
    },

    async start(){
        if(CloudFSClient.client.origin && CloudFSClient.client.headers.authorization){
            return true;
        }

        const storages = await (await fetch(`${CloudFSClient.authEndpoint}/storages`, {
           headers: CloudFSClient.client.headers
        })).json();

        const storagesResponses = await Promise.all(storages.map(storage => fetch(`${storage.endpoint}/exists`, {headers: CloudFSClient.client.headers})));
        const storagesExists = await Promise.all(storagesResponses.map(response => response.text()));
        const filteredStorages = storages.filter((_, index) => storagesExists[index]);

        if(filteredStorages.length === 0){
            // latency test, pick closest
            return true;
        }

        const {port} = await (await fetch(`${filteredStorages.at(0).endpoint}/start`, {headers: CloudFSClient.client.headers})).json();

        const url = new URL(filteredStorages.at(0).endpoint);
        url.port = port;

        let ready = false;
        while (!ready){
            try{
                await fetch(url.toString())
            }catch (e) {
                await new Promise(res => setTimeout(res, 200));
                continue;
            }
            ready = true;
        }

        CloudFSClient.client.origin = url.toString();
        return true;
    }
}

