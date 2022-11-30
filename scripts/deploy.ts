import path from "path";
import fs from "fs";
import glob from "glob";
import {
    askQuestion,
    askToContinue,
    execScript,
    execSSH,
    getSFTPClient,
    printLine,
    uploadFileWithProgress
} from "./utils";
import build from "./build";
import test from "./test";
import yaml from "js-yaml";
import Docker from "./docker";
import certs from "./certs";

/*
*
* 1. try to connect to remote host
* 2. check if docker and docker-compose is installed
* 3. check if app at version is already deployed
* 4. run tests
* 5. build app production mode
* 6. load .fullstacked.json
* 7. determine hostnames required, missing, ask
* 8. Certs script (if no-https, ship fullstacked-nginx)
* 9. save hostnames info locally (.fullstacked.json)
* 10. setup project docker-compose and nginx.conf files
* 11. ship project docker-compose and nginx.conf files
* 12. ship built app
* 13. predeploy script
* 14. pull/up/restart built app
* 15. pull/up/restart fullstacked-nginx
* 16. postdeploy script
* 17. clean up
*
 */

export async function uploadFullStackedNginx(sftp, config){
    if(!await sftp.exists(config.appDir)) await sftp.mkdir(config.appDir);
    const fullStackedNginxDir = path.resolve(__dirname, "..", "nginx")
    const fullStackedNginxFiles = glob.sync(path.resolve(fullStackedNginxDir, "**", "*"))
        .map(file => file.substring(fullStackedNginxDir.length + 1));

    console.log("Uploading FullStacked Nginx onto remote host");
    for(let i = 0; i < fullStackedNginxFiles.length; i++){
        const filePath = path.resolve(fullStackedNginxDir, fullStackedNginxFiles[i]);
        const fileInfo = fs.statSync(filePath);
        if(fileInfo.isDirectory())
            await sftp.mkdir(config.appDir + "/" + fullStackedNginxFiles[i]);
        else
            await sftp.put(filePath, config.appDir + "/" + fullStackedNginxFiles[i]);

        printLine("Progress: " + (i + 1) + "/" + fullStackedNginxFiles.length);
    }
}

async function getAvailablePorts(ssh2, count: number, startingPort: number = 8000): Promise<string[]> {
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

export default async function (config: Config) {
    console.log('\x1b[33m%s\x1b[0m', "You are about to deploy " + config.name + " v" + config.version);
    if(!await askToContinue("Continue"))
        return;

    // 1.
    let sftp = await getSFTPClient(config);

    // 2.
    await Docker(sftp);

    // 3.
    const serverAppDir = config.appDir + "/" + config.name;
    const serverAppDistDir = serverAppDir + "/" + config.version;
    let mustOverWriteCurrentVersion = false;
    if(await sftp.exists(serverAppDistDir)){
        console.log('\x1b[33m%s\x1b[0m', "Version " + config.version + " is already deployed");
        if(!await askToContinue("Overwrite [" + serverAppDistDir + "]")) {
            await sftp.end();
            return;
        }

        mustOverWriteCurrentVersion = true;
    }

    // 4.
    if(!config.skipTest){
        await sftp.end()
        console.log('\x1b[32m%s\x1b[0m', "Launching Tests!");
        test({
            ...config,
            headless: true,
            coverage: true
        });
        sftp = await getSFTPClient(config);
    }

    // 5.
    await build({
        ...config,
        production: true
    });

    // 6.
    let hostnames: {
        [service: string]: {
            [service_port: string]: {
                server_name: string,
                nginx_extra_configs: string
            }
        }
    } = {};
    const fullstackedConfig = path.resolve(config.src, ".fullstacked.json");
    if(fs.existsSync(fullstackedConfig)) hostnames = JSON.parse(fs.readFileSync(fullstackedConfig, {encoding: "utf-8"}));

    // 7.
    const dockerComposeFile = path.resolve(config.dist, "docker-compose.yml");
    const dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFile, {encoding: "utf-8"}));
    const services = Object.keys(dockerCompose.services);
    for(const service of services){
        const ports = dockerCompose.services[service].ports;
        if(!ports) continue;

        for(const port of ports){
            if(hostnames[service] && hostnames[service][port]) continue;

            const domain = await askQuestion(`Enter domain (example.com) or multiple domains (split with space : example.com www.example.com) for ${service} at ${port}\n`);

            if(!hostnames[service]) hostnames[service] = {};
            hostnames[service][port] = {
                server_name: domain,
                nginx_extra_configs: ""
            };

        }
    }

    // 8.
    if(!config.noHttps){
        await certs({
            ...config,
            domain: Object.keys(hostnames).map(service => Object.keys(hostnames[service]).map(port => hostnames[service][port].server_name.split(" "))).flat().flat()
        });
    }else await uploadFullStackedNginx(sftp, config)


    // 9.
    fs.writeFileSync(fullstackedConfig, JSON.stringify(hostnames, null, 2));

    // 10.
    const neededPortsCount = Object.keys(hostnames).map(service => Object.keys(hostnames[service]).filter(port => port.startsWith("${PORT}"))).flat().length;
    const availablePorts = await getAvailablePorts(sftp.client, neededPortsCount);

    const nginxFile = path.resolve(config.dist, "nginx.conf");

    const nginxTemplate = fs.readFileSync(path.resolve(__dirname, "..", "nginx.conf"), {encoding: "utf-8"}) + "\n" +
        (config.noHttps
            ? ""
            : fs.readFileSync(path.resolve(__dirname, "..", "nginx-ssl.conf"), {encoding: "utf-8"}));

    let nginxConf = ""

    Object.keys(dockerCompose.services).forEach(service => {
        if(!dockerCompose.services[service].ports) return;

        dockerCompose.services[service].ports.forEach((port, index) => {
            let externalPort = port.split(":").at(0);
            if(externalPort === "${PORT}"){
                externalPort = availablePorts.shift();
                dockerCompose.services[service].ports[index] = externalPort + port.substring("${PORT}".length);
            }

            nginxConf += nginxTemplate.replace(/\{PORT\}/g, externalPort)
                .replace(/\{SERVER_NAME\}/g, hostnames[service][port].server_name)
                .replace(/\{APP_NAME\}/g, config.name)
                .replace(/\{VERSION\}/g, config.version)
                .replace(/\{EXTRA_CONFIGS\}/g, hostnames[service][port].nginx_extra_configs ?? "")
                .replace(/\{DOMAIN\}/g, hostnames[service][port].server_name.split(" ").at(0));
        });
    });

    fs.writeFileSync(dockerComposeFile, yaml.stringify(dockerCompose));
    fs.writeFileSync(nginxFile, nginxConf);

    // 11.
    if(await sftp.exists(serverAppDir)) await execSSH(sftp.client, `sudo chown ${config.user}:${config.user} ${serverAppDir}`);
    else await sftp.mkdir(serverAppDir, true);
    await sftp.put(dockerComposeFile, serverAppDir + "/docker-compose.yml");
    await sftp.put(nginxFile, serverAppDir + "/nginx.conf");

    // 12.
    if(mustOverWriteCurrentVersion) await sftp.rmdir(serverAppDistDir, true);
    await sftp.mkdir(serverAppDistDir, true);
    const files = glob.sync("**/*", {cwd: config.out})
    const localFiles = files.map(file => path.resolve(config.out, file));

    for (let i = 0; i < files.length; i++) {
        const fileInfo = fs.statSync(localFiles[i]);
        if(fileInfo.isDirectory())
            await sftp.mkdir(serverAppDistDir + "/" + files[i]);
        else
            await uploadFileWithProgress(sftp, localFiles[i], serverAppDistDir + "/" + files[i], `[${i + 1}/${files.length}] `);
    }
    console.log('\x1b[32m%s\x1b[0m', "\nUpload completed");


    // 13.
    await execScript(path.resolve(config.src, "predeploy.ts"), config, sftp);

    // 14.
    if(config.pull){
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverAppDir}/docker-compose.yml stop`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverAppDir}/docker-compose.yml rm -f`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverAppDir}/docker-compose.yml pull`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverAppDir}/docker-compose.yml up -d`);
    }else{
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverAppDir}/docker-compose.yml up -d`);
        await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverAppDir}/docker-compose.yml restart`);
    }

    // 15.
    await execSSH(sftp.client, `docker-compose -p fullstacked-nginx -f ${config.appDir}/docker-compose.yml up -d`);
    await execSSH(sftp.client, `docker-compose -p fullstacked-nginx -f ${config.appDir}/docker-compose.yml restart`);

    // 16.
    await execScript(path.resolve(config.src, "postdeploy.ts"), config, sftp);

    // 17.
    await sftp.end();
    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', config.name + " v" + config.version + " deployed!");
    return process.exit(0);
}



/*
* e.g.,
* {APP_DIR} <-- config.appDir
* ├── nginx.conf
* ├── docker-compose.yml
* ├── /html
* │   └── ...
* ├── /project-1 <-- serverAppDir
* │   ├── docker-compose.yml
* │   ├── nginx.conf
* │   ├── /certs
* │   │   └── ...
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
