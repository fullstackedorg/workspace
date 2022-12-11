import path from "path";
import fs from "fs";
import glob from "glob";
import {
    askQuestion,
    askToContinue,
    execScript,
    execSSH,
    getSFTPClient,
    uploadFileWithProgress,
    randStr
} from "./utils";
import Build from "./build";
import test from "./test";
import yaml from "yaml";
import Docker from "./docker";
import version from "../version";
import Runner from "./runner";
import Config from "./config"
import open from "open";
import waitForServer from "./waitForServer";
import gui from "./gui";
import DockerInstallScripts from "../DockerInstallScripts";
import crypto from "crypto";


/**
 *
 * Test out if your SSH credentials work with the remote host.
 * Make sure the App Directory is writable to publish web apps.
 * Make sure Docker and Docker Compose is installed on remote host.
 *
 * @param credentials
 */
export async function testSSHConnection(credentials: {
    host: string,
    sshPort?: number,
    user: string,
    pass?: string,
    privateKey?: string,
    privateKeyFile?: string,
    appDir: string
}){
    let sftp;
    const getSFTPClientIn3s = new Promise<void>(async (resolve, reject) => {
        let rejected = false;
        const testTimeout = setTimeout(async () => {
            rejected = true;
            reject(Error(`Hanging more than 3s to connect.`));
        }, 3000);
        try{
            sftp = await getSFTPClient(credentials);
            if(rejected)
                await sftp.end();
        }catch (e) {
            reject(e);
        }
        clearTimeout(testTimeout);
        resolve();
    });
    try{
        await getSFTPClientIn3s;
    }catch (e){
        throw e;
    }
    const testDir = `${credentials.appDir}/${randStr(10)}`;
    if(await sftp.exists(testDir)){
        throw Error(`Test directory ${testDir} exist. Exiting to prevent any damage to remote server.`);
        return false;
    }
    await sftp.mkdir(testDir, true);
    await sftp.rmdir(testDir);

    const dockerTest = await testDockerOnRemoteHost(sftp);

    await sftp.end();

    return dockerTest || {success: true};
}

/**
 *
 * Reusable function to test Docker and Docker Compose v2 installation on remote host
 *
 * @param sftp
 */
export async function testDockerOnRemoteHost(sftp){
    const dockerTest = await execSSH(sftp.client, `docker version`);
    if(!dockerTest) {
        return {
            error: {
                docker: "Docker is not installed on the remote host."
            }
        };
    }
    const dockerComposeTest = await execSSH(sftp.client, `docker compose version`);
    if(!dockerComposeTest){
        return {
            error: {
                docker: "Docker Compose v2 is not installed on the remote host."
            }
        }
    }

    return "";
}

/**
 *
 * Try to install docker and docker-compose v2 on remote host for specific distro
 *
 * @param sftpCreds
 * @param pipeStream
 */
export async function tryToInstallDockerOnRemoteHost(sftpCreds, pipeStream){
    const sftp = await getSFTPClient(sftpCreds);
    const distroNameRaw = await execSSH(sftp.client, "cat /etc/*-release");

    let distroName;
    if(distroNameRaw.includes("Amazon Linux release 2"))
        distroName = "Amazon Linux 2";
    else if(distroNameRaw.includes("Rocky Linux"))
        distroName = "Rocky Linux";
    else if(distroNameRaw.includes("Ubuntu"))
        distroName = "Ubuntu";
    else if(distroNameRaw.includes("Debian"))
        distroName = "Debian";


    if(!DockerInstallScripts[distroName]) {
        throw Error(`Don't know the command to install Docker and Docker Compose v2 on ${distroName || distroNameRaw}`);
        return false;
    }

    for(const cmd of DockerInstallScripts[distroName]) {
        pipeStream.write(cmd);
        await execSSH(sftp.client, cmd, pipeStream);
    }

    const dockerTest = await testDockerOnRemoteHost(sftp);

    await sftp.end();

    return dockerTest || {success: true};
}

/**
 *
 * Get Docker Compose content in JS object format
 *
 */
export async function getBuiltDockerCompose(){
    await Build({
        ...globalConfig,
        silent: true,
        production: true
    });

    const dockerComposeFilePath = path.resolve(globalConfig.dist, "docker-compose.yml");
    if(!fs.existsSync(dockerComposeFilePath)) {
        throw Error(`Cannot find docker-compose.yml at path ${dockerComposeFilePath}`);
    }
    const dockerComposeStr = fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"});
    return yaml.parse(dockerComposeStr);
}

/**
 *
 * @return an array of available ports on remote host
 *
 * @param ssh2
 * @param count
 * @param startingPort
 */

async function getAvailablePorts(ssh2, count: number, startingPort: number = 8001): Promise<string[]> {
    const dockerContainerPorts = await execSSH(ssh2, "docker container ls --format \"{{.Ports}}\" -a");
    const portsInUse = dockerContainerPorts.split("\n").map(portUsed =>
        portUsed.split(":").pop().split("->").shift()) // each line looks like "0.0.0.0:8000->8000/tcp"
        .map(port => parseInt(port)) // cast to number
        .filter(port => port || !isNaN(port)); // filter empty strings

    const availablePorts = [];
    while (availablePorts.length < count){
        if(!portsInUse.includes(startingPort))
            availablePorts.push(startingPort);
        startingPort++;
    }

    return availablePorts;
}

/**
 *
 * Find available ports on remote host,
 * then setup docker-compose.yml and nginx-{service}-{port}.conf files.
 *
 * @param nginxConf
 */

async function setupDockerComposeAndNginx(sshCreds, nginxConf, sftp){
    const servicesWithServerNames = nginxConf.filter(service => service.server_names?.length);
    const availablePorts = await getAvailablePorts(sftp.client, servicesWithServerNames.length);
    const dockerCompose = await getBuiltDockerCompose();
    const nginxTemplate = fs.readFileSync(path.resolve(__dirname, "..", "nginx.conf"), {encoding: "utf-8"});
    servicesWithServerNames.forEach((service, serviceIndex) => {
        const port = availablePorts[serviceIndex];
        const nginx = nginxTemplate
            .replace(/\{SERVER_NAME\}/g, service.server_names?.join(" ") ?? "localhost")
            .replace(/\{PORT\}/g, port)
            .replace(/\{EXTRA_CONFIGS\}/g, service.nginx_extra_configs?.join("\n") ?? "");
        fs.writeFileSync(path.resolve(globalConfig.dist, `nginx-${service.name}-${service.port}.conf`), nginx);
        for (let i = 0; i < dockerCompose.services[service.name].ports.length; i++) {
            if(!dockerCompose.services[service.name].ports[i].endsWith(`:${service.port}`)) continue;
            dockerCompose.services[service.name].ports[i] = `${port}:${service.port}`;
        }
    });
    fs.writeFileSync(path.resolve(globalConfig.dist, "docker-compose.yml"), yaml.stringify(dockerCompose));
}

/**
 *
 * Start up app on remote server
 *
 */
async function startAppOnRemoteServer(appDir, sftp){
    await execSSH(sftp.client, `docker compose -p ${globalConfig.name} -f ${appDir}/${globalConfig.name}/docker-compose.yml up -d`);
    await execSSH(sftp.client, `docker compose -p ${globalConfig.name} -f ${appDir}/${globalConfig.name}/docker-compose.yml restart -t 0`);

    await sftp.put(path.resolve(__dirname, "..", "nginx", "nginx.conf"), `${appDir}/nginx.conf`);
    await sftp.put(path.resolve(__dirname, "..", "nginx", "docker-compose.yml"), `${appDir}/docker-compose.yml`);
    await execSSH(sftp.client, `docker compose -p fullstacked-nginx -f ${appDir}/docker-compose.yml up -d`);
    await execSSH(sftp.client, `docker compose -p fullstacked-nginx -f ${appDir}/docker-compose.yml restart -t 0`);
}

const algorithm = 'aes-256-cbc';
const getConfigFilePath = () => path.resolve(globalConfig.src, ".fullstacked");

/**
 * Check if project has saved configs
 */
export function hasSavedConfigs(){
    return fs.existsSync(getConfigFilePath());
}

/**
 *
 * Load saved configs
 *
 * @param password
 */
export function loadConfigs(password){
    try{
        const hashedParts = fs.readFileSync(getConfigFilePath()).toString().split(":");
        const hashedIv = hashedParts.shift();
        const encryptedData = hashedParts.join(":");

        const iv = Buffer.from(hashedIv, 'hex');
        const encryptedText = Buffer.from(encryptedData, 'hex');

        const key = crypto.createHash('md5').update(password).digest("hex");

        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString());
    }catch (e) {
        return {error: "Wrong password or corrupt file"};
    }
}

/**
 *
 * Save config to project
 *
 * @param configs
 * @param password
 */
export function saveConfigs(configs, password){
    const key = crypto.createHash('md5').update(password).digest("hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(JSON.stringify(configs));
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    fs.writeFileSync(getConfigFilePath(), iv.toString('hex') + ":" + encrypted.toString('hex'));
}

/**
 *
 * Core deploy method
 *
 * @param sshCreds
 * @param nginxConfigs
 * @param pipeStream
 */
export async function deploy(sshCreds, nginxConfigs, pipeStream){
    await testSSHConnection(sshCreds);
    const sftp = await getSFTPClient(sshCreds);
    pipeStream.write(JSON.stringify({success: "Connected to Remote Host"}));

    const dockerTestError = await testDockerOnRemoteHost(sftp);
    if(dockerTestError){
        throw Error(dockerTestError.error.docker);
        return;
    }
    pipeStream.write(JSON.stringify({success: "Docker and Docker Compose v2 is installed"}));

    await Build({...globalConfig, silent: true, production: true});
    pipeStream.write(JSON.stringify({success: "Web App is built production mode"}));

    await setupDockerComposeAndNginx(sshCreds, nginxConfigs, sftp);
    pipeStream.write(JSON.stringify({success: "Docker Compose and Nginx is setup"}));

    if(!await sftp.exists(`${sshCreds.appDir}/${globalConfig.name}`))
        await sftp.mkdir(`${sshCreds.appDir}/${globalConfig.name}`, true);
    await uploadFilesToServer(globalConfig.dist, `${sshCreds.appDir}/${globalConfig.name}`, sftp, (progressStr) => {
        pipeStream.write(JSON.stringify({progress: progressStr}))
    });
    pipeStream.write(JSON.stringify({success: "Web App is uploaded to the remote server"}));

    await execScript(path.resolve(globalConfig.src, "predeploy.ts"), globalConfig, sftp);
    pipeStream.write(JSON.stringify({success: "Ran predeploy scripts"}));

    await startAppOnRemoteServer(sshCreds.appDir, sftp);
    pipeStream.write(JSON.stringify({success: "Web App Deployed"}));

    await execScript(path.resolve(globalConfig.src, "postdeploy.ts"), globalConfig, sftp);
    pipeStream.write(JSON.stringify({success: "Ran postdeploy scripts"}));

    await sftp.end();
    return {success: "Deployment Successfull"};
}

async function uploadFilesToServer(localPath, remotePath, sftp, progressCallback: (progress: string) => void){
    const files = glob.sync("**/*", {cwd: localPath})
    const localFiles = files.map(file => path.resolve(localPath, file));

    for (let i = 0; i < files.length; i++) {
        const fileInfo = fs.statSync(localFiles[i]);
        if(fileInfo.isDirectory())
            await sftp.mkdir(remotePath + "/" + files[i]);
        else
            await uploadFileWithProgress(sftp, localFiles[i], remotePath + "/" + files[i], (progress) => {
                progressCallback(`[${i + 1}/${files.length}] Uploading File ${progress.toFixed(2)}%`);
            });
    }
}

let globalConfig;
export default async function (config: Config) {
    globalConfig = config;
    if(config.gui){
        return await gui();
    }

    if(!hasSavedConfigs()) {
        console.log("No saved configuration in project. Please use the GUI once to set up configurations.");
        console.log("Run : npx fullstacked deploy --gui");
        return process.exit(0);
    }

    console.log('\x1b[33m%s\x1b[0m', "You are about to deploy " + config.name + " v" + config.version);
    if(!await askToContinue("Continue"))
        return;



}



/*
* e.g.,
* {APP_DIR} <-- config.appDir
* ├── nginx.conf
* ├── docker-compose.yml
* ├── /project-1 <-- serverAppDir
* │   ├── docker-compose.yml
* │   ├── nginx.conf
* │   ├── /0.0.1 <-- serverAppDistDir
* │   │   ├── index.js
* │   │   └── /public
* │   │       └── ...
* │   └── /0.0.2
* │      ├── index.js
* │      └── /public
* │          └── ...
* └── /project-2
*     └── ...
*/
