import "./mocking";
import {resolve} from "path";
import fs from "fs";
import {fetch} from "fullstacked/webapp/fetch";
import Express, {json} from 'express';
import {exec, execSync} from "child_process";
import glob from "glob";
import {X509Certificate} from "crypto";
import app from "../webapp/src/App";



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

const express = Express();

let serverAppDir;
export const localAppDir = "/apps";
const currentIP = fetch.get("https://api.ipify.org/");

function inspectNodeService(appID){
    const containerID = execSync(`docker compose -p ${appID} -f ${resolve(localAppDir, appID, "docker-compose.yml")} ps -q node`).toString();
    const dockerInspect = JSON.parse(execSync(`docker inspect ${containerID}`).toString());
    if(!dockerInspect?.length) return null;
    return dockerInspect;
}


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
            return;
        }
    }
})();

express.get("/", async (req, res, next) => {
    if(req.protocol === "https" || req.headers['x-forwarded-proto'] === "https" || req.hostname === await currentIP) return next();

    const certsDir = resolve(localAppDir, "fullstacked-server", "certs");
    if(!fs.existsSync(certsDir)) return next();

    const fullchainFiles = glob.sync(resolve(certsDir, "**", "fullchain.pem"));

    for (const fullchain of fullchainFiles){
        const cert = new X509Certificate(fs.readFileSync(fullchain));

        if(!cert.subjectAltName) continue;

        const isExpired = (new Date(cert.validTo).getTime() - Date.now()) < 0;
        const domains = cert.subjectAltName.split(",").map(record => record.trim().substring("DNS:".length));
        if(domains.includes(req.hostname) && !isExpired){
            return res.redirect(302, `https://${req.hostname}`);
        }
    }
    next();
});

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
    const serverNames = getStringBetween(nginx, "server_name", ";").trim().split(" ");

    const certsDir = resolve(localAppDir, appID, "certs");
    const fullchainFiles = glob.sync(resolve(certsDir, "**", "fullchain.pem"));
    const certificates = fullchainFiles.map(fullchain => {
        const cert = new X509Certificate(fs.readFileSync(fullchain));
        return {
            validTo: (new Date(cert.validTo)).getTime(),
            domains: cert.subjectAltName?.split(",").map(record => record.trim().substring("DNS:".length))
        }
    });

    const nginxExtraFile = resolve(localAppDir, appID, "nginx-extra.conf");
    const nginxExtra = fs.existsSync(nginxExtraFile)
        ? fs.readFileSync(nginxExtraFile, {encoding: "utf-8"})
        : "none";

    res.json({
        version,
        date: fs.statSync(resolve(localAppDir, appID, version)).mtimeMs,
        serverNames,
        port,
        certificates,
        nginxExtra
    })
});

express.get("/ip", async (req, res) => {
    res.send(await currentIP);
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
        certbotProcess.on("end", resolve);
    });

    const certsDir = resolve(localAppDir, appID, "certs", hostnames.at(0));
    if(!fs.existsSync(certsDir)) {
        res.write("Certificates Generation Failed...");
        return res.end();
    }

    const nginxFileName = appID === "fullstacked-server"
        ? "nginx-root.conf"
        : "nginx.conf";
    const nginxFilePath = resolve(localAppDir, appID, nginxFileName);
    const nginx = fs.readFileSync(nginxFilePath, {encoding: "utf-8"});
    const nginxSSL = `server {
        listen      443 ssl default_server;
        ssl_certificate     ${certsDir}/fullchain.pem;
        ssl_certificate_key ${certsDir}/privkey.pem;
        
        location / {
            proxy_pass ${getStringBetween(nginx, "proxy_pass", ";").trim()};
            
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto https;
        }
    }`;
    fs.writeFileSync(resolve(localAppDir, appID, "nginx-ssl.conf"), nginxSSL);

    execSync(`docker compose -p fullstacked-server -f ${resolve(localAppDir, "fullstacked-server", "docker-compose.yml")} restart nginx -t 0`);
    res.write("FullStacked Server nginx restarted");

    res.end();
});


export default express;
