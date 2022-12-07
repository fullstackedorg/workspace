import "./mockingFS";
import Server from "fullstacked/server";
import {resolve} from "path";
import fs from "fs";
import {fetch} from "fullstacked/webapp/fetch";
import Express, {json} from 'express';
import {exec, execSync} from "child_process";

Server.port = 8000;

try{
    execSync("docker --version");
    execSync("docker compose");
}catch (e){
    const dockerCLIInstallation = exec(`apk update && apk add --no-cache docker-cli docker-cli-compose`);
    dockerCLIInstallation.stdout.pipe(process.stdout);
    dockerCLIInstallation.stderr.pipe(process.stderr);
}

function waitForDocker(){
    return new Promise<void>(resolve => {
        try{
            execSync("docker --version");
            execSync("docker compose");
            resolve();
        } catch (e){}

        const interval = setInterval(() => {
            try{
                execSync("docker --version");
                execSync("docker compose");
            } catch (e){
                return;
            }
            clearInterval(interval);
            resolve();
        }, 100)
    })
}


Server.start();

const express = Express();

const {promisifiedListener, resolver} = Server.promisify(express);

export const localAppDir = "/apps";

function inspectNodeService(appID){
    const containerID = execSync(`docker compose -p ${appID} -f ${resolve(localAppDir, appID, "docker-compose.yml")} ps -q node`).toString();
    const dockerInspect = JSON.parse(execSync(`docker inspect ${containerID}`).toString());
    if(!dockerInspect?.length) return null;
    return dockerInspect;
}


let serverAppDir;
(async () => {
    await waitForDocker();
    const dockerInspect = inspectNodeService("fullstacked-server");
    if(!dockerInspect?.length) return null;

    const mounts = dockerInspect.at(0).Mounts;
    for(const mount of mounts) {
        if (mount.Destination === "/app") {
            const pathComponents = mount.Source.split("/");
            pathComponents.pop(); // version
            pathComponents.pop(); // appID
            serverAppDir = pathComponents.join("/");
            console.log(serverAppDir)
            return;
        }
    }
})()

express.get("/apps", (req, res) => {
    res.json(fs.readdirSync(localAppDir).filter(appName => {
        return appName !== "fullstacked-server"
            && fs.statSync(resolve(localAppDir, appName)).isDirectory()
            && !appName.startsWith(".")
            && fs.existsSync(resolve(localAppDir, appName, "docker-compose.yml"));
    }));
});

function getCurrentRunningAppVersion(appID: string){
    const dockerInspect = inspectNodeService(appID);
    if(!dockerInspect?.length) return null;

    const mounts = dockerInspect.at(0).Mounts;
    for(const mount of mounts)
        if(mount.Destination === "/app")
            return mount.Source.split("/").pop();

    return null;
}

function getStringBetween(str, start, end){
    const regex = new RegExp(start + ".*?" + end);
    const match = str.match(regex);

    if(!match) return "";

    return match[0].slice(start.length, -end.length);
}

express.get("/apps/:appID", (req, res) => {
    const appID = req.params.appID;
    const version = getCurrentRunningAppVersion(appID);

    const nginx = fs.readFileSync(resolve(localAppDir, appID, "nginx.conf"), {encoding: "utf-8"});

    const port = getStringBetween(nginx, "proxy_pass", ";").trim().split(":").pop();
    const serverName = getStringBetween(nginx, "server_name", ";").trim();

    res.json({
        version,
        date: fs.statSync(resolve(localAppDir, appID, version)).mtimeMs,
        serverName,
        port
    })
});

express.get("/ip", async (req, res) => {
    res.json((await fetch.get("https://api.ipify.org/?format=json")).ip);
});

express.post("/certs", json(), async (req, res) => {
    const email = req.body.email;
    const appID = req.body.appID;
    const hostnames = req.body.hostnames;

    const currentAppDir = resolve(serverAppDir, appID);
    const currentAppCertsDir = resolve(serverAppDir, appID, "certs");

    if(fs.existsSync(currentAppCertsDir)) fs.mkdirSync(currentAppCertsDir);

    const currentAppPublicDir = resolve(currentAppDir, getCurrentRunningAppVersion(appID), "public");

    const certbotCMD = [
        "docker run --rm --name certbot",
        `-v ${currentAppPublicDir}:/html`,
        `-v ${currentAppCertsDir}:/etc/letsencrypt/live`,
        `-v ${resolve(currentAppCertsDir, "..", "archive")}:/etc/letsencrypt/archive`,
        `certbot/certbot certonly --webroot --agree-tos --no-eff-email -m ${email} -w /html`,
        hostnames.map(hostname => `-d ${hostname}`).join(" ")
    ];

    await new Promise<void>(resolve => {
        let certbotProcess = exec(certbotCMD.join(" "));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        certbotProcess.stdout.on("data", chunk => res.write(chunk));
        certbotProcess.stderr.on("data", chunk => res.write(chunk));
        certbotProcess.on("exit", resolve);
    });

    res.end();
});

express.use(resolver);

Server.addListener(promisifiedListener);
