import {homedir} from "os";
import fs from "fs";
import createClient from "@fullstacked/webapp/rpc/createClient";

export class CloudFSClient {
    static authEndpoint = process.env.AUTH || "https://auth.fullstacked.cloud";
    static authTokenFile = `${homedir()}/.fullstacked`;
    static client: ReturnType<typeof createClient<typeof fs>> = createClient<typeof fs>();
    static setAuthToken(token: string) {
        this.client.headers.authorization = token;
        fs.writeFileSync(this.authTokenFile, token);
    }
}
