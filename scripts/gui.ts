import Server from "../server";
import {getNextAvailablePort} from "./utils";
import Run from "./run";
import Config from "./config";
import path from "path";
import waitForServer from "./waitForServer";
import open from "open";
import fs from "fs";
import yaml from "yaml";
import {IncomingMessage} from "http";
import {
    testSSHConnection, tryToInstallDockerOnRemoteHost, getBuiltDockerCompose,
    deploy, saveConfigs, loadConfigs, hasSavedConfigs, generateCertificateOnRemoteHost,
    getCertificateData
} from "./deploy";
import multer from "multer";
import {fetch} from "../webapp/fetch"

const endpoints = [
    {
        path: "/check",
        callback: async (req, res) => {
            return JSON.stringify({hasSavedConfigs: hasSavedConfigs()});
        }
    },
    {
        path: "/load",
        callback: async (req, res) => {
            return JSON.stringify(loadConfigs(req.body.password));
        }
    },
    {
        path: "/ssh",
        callback: async (req, res) => {
            let sshCredentials = req.body;

            if (req.file) {
                sshCredentials.privateKey = req.file.buffer
            }

            try {
                return JSON.stringify(await testSSHConnection(req.body));
            } catch (e) {
                return JSON.stringify({error: e.message});
            }
        }
    },{
        path: "/docker-install",
        callback: async (req, res) => {
            let sshCredentials = req.body;

            if (req.file) {
                sshCredentials.privateKey = req.file.buffer
            }

            try{
                return JSON.stringify(await tryToInstallDockerOnRemoteHost(req.body, res));
            }catch (e){
                return JSON.stringify({error: e.message});
            }
        }
    },{
        path: "/docker-compose",
        callback: async (req, res) => {
            try{
                return JSON.stringify(await getBuiltDockerCompose());
            }catch (e){
                return JSON.stringify({error: e.message});
            }
        }
    },{
        path: "/deploy",
        callback: async (req, res) => {
            let sshCredentials = req.body;

            if (req.file) {
                sshCredentials.privateKey = req.file.buffer
            }

            let nginxConfigs = JSON.parse(req.body.nginxConfigs);

            const certificate = JSON.parse(req.body.certificate);

            try{
                return JSON.stringify(await deploy(sshCredentials, nginxConfigs, certificate, res));
            }catch (e){
                return JSON.stringify({error: e.message});
            }
        }
    },{
        path: "/test",
        callback: async (req, res) => {
            const url = req.body.url;
            let test = {
                http: false,
                https: false
            }

            try{
                await fetch.get(`http://${url}`, null, {
                    timeout: 3000
                });
                test.http = true;
            }catch (e) {}

            try{
                await fetch.get(`https://${url}`, null, {
                    timeout: 3000
                });
                test.https = true;
            }catch (e) {}

            return JSON.stringify(test);
        }
    },{
        path: "/cert",
        callback: (req, res) => {
            return JSON.stringify(getCertificateData(req.body.fullchain))
        }
    },{
        path: "/new-cert",
        callback: async (req, res) => {
            let sshCredentials = req.body;

            if (req.file) {
                sshCredentials.privateKey = req.file.buffer
            }

            return JSON.stringify(await generateCertificateOnRemoteHost(sshCredentials, req.body.email, JSON.parse(req.body.serverNames), res))
        }
    },{
        path: "/save",
        callback: async (req, res) => {
            const password = req.body.password;

            let sshCredentials = req.body;

            if (req.file) {
                sshCredentials.privateKey = req.file.buffer.toString();
            }

            let nginxConfigs = JSON.parse(req.body.nginxConfigs);
            delete sshCredentials.nginxConfigs;
            delete sshCredentials.password;

            const certificate = JSON.parse(req.body.certificate);

            const configs = {
                sshCredentials,
                nginxConfigs,
                certificate
            };

            saveConfigs(configs, password);

            return JSON.stringify({success: true});
        }
    }
]

function readBody(req){
    return new Promise<any>(resolve => {
        let data = "";
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data ? JSON.parse(data) : null));
    });
}

export default async function (){
    Server.port = await getNextAvailablePort();
    Server.start();
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Max-Age': 2592000
    };
    Server.addListener(async (req: IncomingMessage & {body: any}, res) => {
        if (req.method === 'OPTIONS') {
            res.writeHead(204, headers);
            return res.end();
        }

        for(const endpoint of endpoints) {
            if(endpoint.path !== req.url || res.headersSent) continue;

            if(req.method === "POST") {
                if(req.headers["content-type"].startsWith('multipart/form-data'))
                    await new Promise((resolve) => {
                        multer({ storage: multer.memoryStorage() }).single("file")(req, res, resolve)
                    });
                else
                    req.body = await readBody(req);
            }

            res.writeHead(200, {
                ...headers,
                'content-type': 'application/json'
            });
            res.write(await endpoint.callback(req, res));
            return res.end();
        }
    }, true);

    const dockerComposeFile = path.resolve(__dirname, "..", "gui", "dist", "docker-compose.yml");
    const dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFile, {encoding: "utf-8"}));
    dockerCompose.services.node.command = `node index --port=${Server.port}`;
    fs.writeFileSync(dockerComposeFile, yaml.stringify(dockerCompose));
    const runner = await Run(Config({
        src: path.resolve(__dirname, "..", "gui"),
        out: path.resolve(__dirname, "..", "gui")
    }), false);
    await waitForServer(3000, `http://localhost:${runner.nodePort}`);
    return open(`http://localhost:${runner.nodePort}`);
}
