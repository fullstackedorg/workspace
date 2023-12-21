import os from "os";
import fs from "fs";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { Listener } from "@fullstacked/webapp/server";
import sleep from "@fullstacked/cli/utils/sleep";
import { TerminalPTy } from "../terminal/pty";

// FullStacked GitHub client IDs
const client_id = process.env.FULLSTACKED_ENV === "production"
    ? "eb999bfaaa05b2118843"
    : "8e4c6413c4f5a14e828f";


// this is usefull to get your github credential
// to push/clone/pull from github
// more info: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
export default class extends BackendTool {
    api = {
        async initGithubDeviceFlow(SESSION_ID: string) {
            const credentialFile = os.homedir() + "/.github-credential";
            if (fs.existsSync(credentialFile))
                return fs.readFileSync(credentialFile);

            const session = TerminalPTy.sessions.get(SESSION_ID);
            if (!session) return;

            const deviceCode = await (await fetch("https://github.com/login/device/code", {
                method: "post",
                headers: {
                    "content-type": "application/json",
                    "accept": "application/json"
                },
                body: JSON.stringify({
                    client_id,
                    scope: "repo,user:email"
                })
            })).json();

            session.ws.send(`GITHUB_DEVICE_FLOW#${deviceCode.verification_uri}#${deviceCode.user_code}`);

            const access_token = await waitForAccessToken(deviceCode.device_code);

            if (!access_token)
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
                if (!email.primary) return;
                fs.appendFileSync(os.homedir() + "/.gitconfig",
                    `[user]
    email = ${email.email}
    name = ${username}`);
            });

            session.ws.send(`GITHUB_DEVICE_FLOW_DONE`);

            const credential = `username=${username}
password=${access_token}`;
            fs.writeFileSync(credentialFile, credential)

            return credential;
        }
    };
    
    listeners: (Listener & { prefix?: string; })[];
    websocket: WebSocketRegisterer;

}

// making sure we don't but the rate limit
// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#rate-limits-for-the-device-flow
const timeLimit = 1000 * 60 * 20 // 20 minutes
async function waitForAccessToken(device_code) {
    let access_token, wait_time = 10;
    const start = Date.now();
    while (!access_token) {
        if (Date.now() - start > timeLimit) return null;
        await sleep(wait_time * 1000 + 500);
        const response = await (await fetch("https://github.com/login/oauth/access_token", {
            method: "post",
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            },
            body: JSON.stringify({
                client_id,
                device_code,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code"
            })
        })).json();

        if (response.error === "slow_down")
            wait_time = response.interval;

        if (response.access_token)
            access_token = response.access_token
    }
    return access_token;
}