import SFTP from "ssh2-sftp-client";
import path from "path";
import fs from "fs";
import glob from "glob";
import {askQuestion, askToContinue, execScript, execSSH, printLine} from "./utils";
import build from "./build";
import test from "./test";
import yaml from "yaml";

/*
*
* 1. try to connect to remote host
* 2. check if app at version is already deployed
* 3. check if docker and docker-compose is installed
* 4. run tests
* 5. ship fullstacked-nginx config files
* 6. build app production mode
* 7. setup and ship project docker-compose file
* 8. setup and ship project nginx.conf file
* 9. ship built app
* 10. pull/up/restart built app
* 11. pull/up/restart fullstacked-nginx
*
 */

// check if docker is installed on remote host
async function isDockerInstalledOnRemote(ssh2): Promise<boolean>{
    const dockerVersion = await execSSH(ssh2, "docker -v");
    return dockerVersion !== "";
}

// install docker on remote host
async function installDocker(ssh2) {
    let commands = [
        "yum install docker -y",
        "wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)",
        "mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose",
        "chmod -v +x /usr/local/bin/docker-compose",
        "systemctl enable docker.service",
        "systemctl start docker.service",
        "chmod 666 /var/run/docker.sock"
    ]

    for (let i = 0; i < commands.length; i++) {
        await execSSH(ssh2, "sudo " + commands[i]);
    }
}

export async function setupNginxFile(nginxFilePath: string, cachedServerNamesFilePath: string, name: string, version: string, portsMap: Map<string, string[]>){
    let cachedServerNames = {};
    if(fs.existsSync(cachedServerNamesFilePath)){
        cachedServerNames = JSON.parse(fs.readFileSync(cachedServerNamesFilePath, {encoding: 'utf-8'}));
    }

    const serverNames = await getServerNamesConfigs(portsMap, cachedServerNames);
    const nginxFileTemplate = path.resolve(__dirname, "../nginx.conf");
    let content = fs.readFileSync(nginxFileTemplate, {encoding: "utf-8"});
    let nginxOutputContent = "";
    let serverNamesJSONOutput = {};

    for(const {service, externalPort, internalPort, serverName, extraConfigs} of serverNames){
        nginxOutputContent += content.replace(/\{PORT\}/g, externalPort)
            .replace(/\{SERVER_NAME\}/g, serverName)
            .replace(/\{APP_NAME\}/g, name)
            .replace(/\{VERSION\}/g, version)
            .replace(/\{EXTRA_CONFIGS\}/g, extraConfigs ?? "");

        console.log(serverName + "->" + "0.0.0.0:" + externalPort + " for " + service + " at port " + internalPort);

        if(!serverNamesJSONOutput[service])
            serverNamesJSONOutput[service] = {};

        serverNamesJSONOutput[service][internalPort] = {
            server_name: serverName
        }

        if(extraConfigs)
            serverNamesJSONOutput[service][internalPort].nginx_extra_configs = extraConfigs;
    }

    fs.writeFileSync(nginxFilePath, nginxOutputContent);
    fs.writeFileSync(cachedServerNamesFilePath, JSON.stringify(serverNamesJSONOutput));
}

async function getPortsMap(ssh2, dockerCompose, startingPort: number = 8000): Promise<Map<string, string[]>> {
    const portsMap = new Map<string, string[]>();

    const dockerContainerPorts = await execSSH(ssh2, "docker container ls --format \"{{.Ports}}\" -a");
    const portsInUse = dockerContainerPorts.split("\n").map(portUsed =>
        portUsed.split(":").pop().split("->").shift()) // each line looks like "0.0.0.0:8000->8000/tcp"
        .map(port => parseInt(port)) // cast to number
        .filter(port => port || !isNaN(port)); // filter empty strings


    const services = Object.keys(dockerCompose.services);
    for(const service of services){
        const exposedPorts = dockerCompose.services[service].ports;
        if(!exposedPorts) continue;

        let chosenPorts = [];
        for(const port of exposedPorts){
            if(!port.startsWith("${PORT}")) {
                chosenPorts.push(port);
                continue;
            }

            let availablePort = startingPort;

            while(portsInUse.includes(availablePort)){
                availablePort = availablePort + 1;
            }

            portsInUse.push(availablePort);
            chosenPorts.push(port.replace("${PORT}", availablePort));
        }
        portsMap.set(service, chosenPorts)
    }

    return portsMap;
}

// get server name for each service
export async function getServerNamesConfigs(portsMap: Map<string, string[]>,
                                            cachedServerNames: {
                                                [service: string]: {
                                                    [port: string]: {
                                                        server_name: string,
                                                        nginx_extra_configs?: string
                                                    }
                                                }
                                            })
 {
    const serverNameForService: {
        service: string,
        externalPort: string,
        internalPort: string,
        serverName: string,
        extraConfigs?: string
    }[] = [];
    for (const [service, ports] of portsMap.entries()) {
        for(const port of ports){
            const exposedPortArr = port.split(":");
            const externalPort = exposedPortArr[0];
            const internalPort = exposedPortArr[exposedPortArr.length - 1];

            const serverName = cachedServerNames[service] && cachedServerNames[service][internalPort]
                ? cachedServerNames[service][internalPort].server_name
                : await askQuestion(service === "nope"
                    ? "Enter server name for main web app : \n"
                    : `Enter server name for service ${service} at port ${internalPort}: \n`);

            const extraConfigs = cachedServerNames[service] && cachedServerNames[service][internalPort] ?
                cachedServerNames[service][internalPort].nginx_extra_configs : "";

            serverNameForService.push({
                service: service,
                externalPort: externalPort,
                internalPort: internalPort,
                serverName: serverName,
                extraConfigs: extraConfigs
            });
        }
    }

    return serverNameForService;
}

// deploy app using docker compose
async function deployDockerCompose(config: Config, sftp, serverPath, serverPathDist){
    const dockerComposeFilePath = path.resolve(config.dist, "docker-compose.yml");
    let dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"}));

    // get available ports for each services
    const portsMap = await getPortsMap(sftp.client, dockerCompose, 8000);

    // setup and ship docker-compose file
    for(const [service, ports] of portsMap.entries()){
        dockerCompose.services[service].ports = ports;
    }
    fs.writeFileSync(dockerComposeFilePath, yaml.stringify(dockerCompose));
    await sftp.put(path.resolve(config.dist, "docker-compose.yml"), serverPath + "/docker-compose.yml");

    // setup and ship nginx
    if(!config.noNginx) {
        const nginxFilePath = path.resolve(config.dist, "nginx.conf");

        // check for cached file
        const cachedServerNamesFilePath = path.resolve(config.src, ".server-names");

        // setup server names in nginx
        await setupNginxFile(nginxFilePath, cachedServerNamesFilePath, config.name, config.version, portsMap);

        // upload nginx to remote host
        await sftp.put(nginxFilePath, serverPath + "/nginx.conf");
    }

    // gather all dist files for version
    const files = glob.sync("**/*", {cwd: config.out})
    const localFilePaths = files.map(file => path.resolve(config.out, file));

    // upload all files
    for (let i = 0; i < files.length; i++) {
        const fileInfo = fs.statSync(localFilePaths[i]);
        if(fileInfo.isDirectory())
            await sftp.mkdir(serverPathDist + "/" + files[i]);
        else
            await sftp.put(localFilePaths[i], serverPathDist + "/" + files[i]);

        printLine("Progress: " + (i + 1) + "/" + files.length);
    }
    console.log('\x1b[32m%s\x1b[0m', "\nUpload completed");

    console.log('\x1b[33m%s\x1b[0m', "Starting app");

    // start app
    if(config.pull){
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverPath}/docker-compose.yml stop`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverPath}/docker-compose.yml rm -f`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverPath}/docker-compose.yml pull`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverPath}/docker-compose.yml up -d`);
    }else{
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverPath}/docker-compose.yml up -d`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverPath}/docker-compose.yml restart`);
    }
}

export default async function (config: Config) {
    console.log('\x1b[33m%s\x1b[0m', "You are about to deploy " + config.name + " v" + config.version);
    if(!await askToContinue("Continue"))
        return;

    const sftp = new SFTP();

    // setup ssh connection
    let connectionConfig: any = {
        host: config.host,
        username: config.user
    }

    if(config.sshPort)
        connectionConfig.port = config.sshPort;

    if(config.pass)
        connectionConfig.password = config.pass;

    if(config.privateKey)
        connectionConfig.privateKey = fs.readFileSync(path.resolve(process.cwd(), config.privateKey));

    await sftp.connect(connectionConfig);

    // path where the build app files will be
    const serverPath = config.appDir + "/" + config.name;
    // add to that the version number as directory
    const serverPathDist = serverPath + "/" + config.version;
    /*
    * e.g.,
    * /home
    * |_ nginx.conf
    * |_ /project-1
    * |  |_ docker-compose.yml
    * |  |_ nginx.conf
    * |  |_ /0.0.1
    * |  |  |_ index.js
    * |  |  |_ /public
    * |  |  |  |_ ...
    * |  |_ /0.0.2
    * |  |  |_ index.js
    * |  |  |_ /public
    * |  |  |  |_ ...
    * |_ /project-2
    * |  |_ ...
    * ...
     */

    // check if version was already deployed
    let mustOverWriteCurrentVersion = false;
    if(await sftp.exists(serverPathDist)){
        console.log('\x1b[33m%s\x1b[0m', "Version " + config.version + " is already deployed");
        if(!await askToContinue("Overwrite [" + serverPathDist + "]")) {
            await sftp.end();
            return;
        }

        mustOverWriteCurrentVersion = true;
    }

    // check if docker is installed on remote
    if(!await isDockerInstalledOnRemote(sftp.client)) {
        console.log('\x1b[33m%s\x1b[0m', "You are about to install Docker on your remote host");
        if(!await askToContinue("Continue"))
            return;

        await installDocker(sftp.client);
        if(!await isDockerInstalledOnRemote(sftp.client))
            return console.log('\x1b[31m%s\x1b[0m', "Could not install Docker on remote host");
    }

    if(!config.skipTest){
        console.log('\x1b[32m%s\x1b[0m', "Launching Tests!");
        test({
            ...config,
            headless: true,
            coverage: true
        });
    }

    // send fullstacked-nginx files at appDir
    if(!await sftp.exists(config.appDir))
        await sftp.mkdir(config.appDir, true);

    await sftp.put(path.resolve(__dirname, "../nginx/docker-compose.yml"), config.appDir + "/docker-compose.yml");

    if(!config.noNginx) {
        await sftp.put(path.resolve(__dirname, "../nginx/nginx.conf"), config.appDir + "/nginx.conf");
    }

    // build app
    await build({
        ...config,
        production: true
    });

    // predeploy script
    await execScript(path.resolve(config.src, "predeploy.ts"), config, sftp);

    // clean and create directory
    if(mustOverWriteCurrentVersion)
        await sftp.rmdir(serverPathDist, true);
    await sftp.mkdir(serverPathDist, true);

    // create self-signed certificate
    // TODO: Allow to provide legit certificates
    await execSSH(sftp.client, `openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ${serverPathDist}/key.pem -out ${serverPathDist}/cert.pem -days 365`);

    // deploy
    await deployDockerCompose(config, sftp, serverPath, serverPathDist);

    // up/restart fullstacked-nginx
    if(!config.noNginx) {
        await execSSH(sftp.client, `docker-compose -p fullstacked-nginx -f ${config.appDir}/docker-compose.yml up -d`);
        await execSSH(sftp.client, `docker-compose -p fullstacked-nginx -f ${config.appDir}/docker-compose.yml restart`);
    }

    // close connection
    await sftp.end();

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', config.name + " v" + config.version + " deployed!");

    // post deploy script
    await execScript(path.resolve(config.src, "postdeploy.ts"), config);

    process.exit(0);
}
