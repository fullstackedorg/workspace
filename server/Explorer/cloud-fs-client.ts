import {homedir} from "os";
import fs from "fs";
import createClient from "@fullstacked/webapp/rpc/createClient";


export class CloudFSClient {
    static endpoint = process.env.STORAGE_ENDPOINT || "https://auth2.fullstacked.cloud/storages";
    static authorization;
    static authTokenFile = `${homedir()}/.fullstacked`;
    static client: ReturnType<typeof createClient<typeof fs>> = createClient<typeof fs>();
    static setAuthorization(token: string) {
        CloudFSClient.authorization = token;
        this.client.headers.authorization = token;
        fs.writeFileSync(this.authTokenFile, token);
    }
}

if(fs.existsSync(CloudFSClient.authTokenFile))
    CloudFSClient.authorization = fs.readFileSync(CloudFSClient.authTokenFile).toString()
