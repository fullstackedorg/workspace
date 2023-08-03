import Server from "@fullstacked/webapp/server";
import createListener from "@fullstacked/webapp/rpc/createListener";
import {Terminal} from "./terminal";
import sleep from "@fullstacked/cli/utils/sleep";
import fs from "fs";
import * as os from "os";

export function initInternalRPC(terminal: Terminal){
    const server = new Server();
    server.port = 14014;

    const rpc = {

        async initGithubDeviceFlow(SESSION_ID: string){
            const credentialFile = os.homedir() + "/.github-credential";
            if(fs.existsSync(credentialFile))
                return fs.readFileSync(credentialFile);

            const session = terminal.sessions.get(SESSION_ID);
            if(!session) return;

            const deviceCode = await (await fetch("https://github.com/login/device/code", {
                method: "post",
                headers: {
                    "content-type": "application/json",
                    "accept": "application/json"
                },
                body: JSON.stringify({
                    client_id: "8e4c6413c4f5a14e828f",
                    scope: "repo,user:email"
                })
            })).json();

            session.ws.send(`GITHUB_DEVICE_FLOW#${deviceCode.verification_uri}#${deviceCode.user_code}`);

            const access_token = await waitForAccessToken(deviceCode.device_code);

            if(!access_token)
                return "";

            const user = await (await fetch("https://api.github.com/user", {
                headers: {
                    authorization: `Bearer ${access_token}`,
                    "accept": "application/json"
                }
            })).json();

            const username = user.login;

            const emails = await (await fetch("https://api.github.com/user/emails", {
                headers: {
                    authorization: `Bearer ${access_token}`,
                    "accept": "application/json"
                }
            })).json();

            emails.forEach(email => {
                if(!email.primary) return;
                fs.appendFileSync(os.homedir() + "/.gitconfig",
                    `[user]
email = ${email}
name = ${username}`);
            });

            session.ws.send(`GITHUB_DEVICE_FLOW_DONE`);

            const credential = `username=${username}
password=${access_token}`;
            fs.writeFileSync(credentialFile, credential)

            return credential;
        }


    }

    server.addListener(createListener(rpc));
    server.start();
}


const timeLimit = 1000 * 60 * 20 // 20 minutes
async function waitForAccessToken(device_code){
    let access_token;
    const start = Date.now();
    while(!access_token){
        if(Date.now() - start > timeLimit) return null;
        await sleep(5000);
        const response = await (await fetch("https://github.com/login/oauth/access_token", {
            method: "post",
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            },
            body: JSON.stringify({
                client_id: "8e4c6413c4f5a14e828f",
                device_code,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code"
            })
        })).json();

        if(response.access_token)
            access_token = response.access_token
    }
    return access_token;
}
