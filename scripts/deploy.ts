import SFTP from "ssh2-sftp-client";
import path from "path";
import fs from "fs";
import glob from "glob";
import {askToContinue, execScript, getPackageJSON, isDockerInstalled, printLine} from "./utils";
import build from "./build";
import {exec} from "child_process";
import yaml from "yaml";

// exec command on remote host over ssh
function execSSH(ssh2, cmd){
    return new Promise(resolve => {
        let message = "";
        ssh2.exec(cmd, (err, stream) => {
            if (err) throw err;

            stream.on('data', data => {
                process.stdout.write(data);
                message += data.toString();
            });
            stream.on('close', () => resolve(message));
        });
    });
}

// check if docker is installed on remote host
async function isDockerInstalledOnRemote(ssh2): Promise<boolean>{
    const dockerVersion = await execSSH(ssh2, "docker -v");
    return dockerVersion !== "";
}

// install docker on remote host
async function installDocker(ssh2, sudo: boolean) {
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
        await execSSH(ssh2, (sudo ? "sudo " : "") + commands[i]);
    }
}

function runTests(){
    console.log('\x1b[32m%s\x1b[0m', "Launching Tests!");

    return new Promise((resolve) => {
        let testCommand = `node ${path.resolve(__dirname, "../cli")} test --headless --coverage`;

        const testProcess = exec(testCommand);
        testProcess.stdout.pipe(process.stdout);
        testProcess.stderr.on("data", (data) => {
            console.error(data);
            resolve(false);
        });
        testProcess.on("exit", () => resolve(true));
    });
}

// prepare docker compose file for deployment
function setupDockerComposeFile(config){
    const outFile = config.out + "/docker-compose.yml";
    const composeFileTemplate = path.resolve(__dirname, "../docker-compose.yml");
    fs.copyFileSync(composeFileTemplate, outFile);

    let content = fs.readFileSync(outFile, {encoding: "utf-8"});

    content = content.replace("${PORT}", config.port ?? 80);

    if(config.portHTTPS){
        let yamlContent = yaml.parse(content);
        yamlContent.services.node.ports.push(config.portHTTPS + ":8443");
        content = yaml.stringify(yamlContent);
    }

    fs.writeFileSync(outFile, content);
}

// deploy app using docker compose
async function deployDockerCompose(config: Config, sftp, serverPath, serverPathDist, appName){
    setupDockerComposeFile(config);

    const files = glob.sync("**/*", {cwd: config.out})
    const localFilePaths = files.map(file => path.resolve(process.cwd(), config.out, file));

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

    const cmdUP = `docker-compose -p ${appName} -f ${serverPathDist}/docker-compose.yml up -d`;
    const cmdDOWN = `docker-compose -p ${appName} -f ${serverPathDist}/docker-compose.yml down -v`;

    await startDeployment(config, cmdUP, cmdDOWN, sftp, serverPath, serverPathDist);
}

async function startDeployment(config: Config, cmdUP, cmdDOWN, sftp, serverPath, serverPathDist){
    // check if there is a command to down current app
    const savedDown = serverPath + "/down.txt";
    if(await sftp.exists(savedDown)){
        const command = (await sftp.get(savedDown)).toString().trim();
        console.log('\x1b[33m%s\x1b[0m', "Stopping current running app");
        await execSSH(sftp.client, command);
    }

    // create some self-signed certificate
    if(config.portHTTPS)
        await execSSH(sftp.client, `openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ${serverPathDist}/key.pem -out ${serverPathDist}/cert.pem -days 365`);

    console.log('\x1b[33m%s\x1b[0m', "Starting app");
    // exec start command
    await execSSH(sftp.client, cmdUP);
    // save down command for next deployment
    await execSSH(sftp.client, `echo "${cmdDOWN}" > ${savedDown}`);
}

export default async function (config: Config) {
    const packageConfigs = getPackageJSON();
    if(Object.keys(packageConfigs).length === 0)
        return console.log('\x1b[31m%s\x1b[0m', "Could not find package.json file or your package.json is empty");

    if(!packageConfigs.version)
        return console.log('\x1b[31m%s\x1b[0m', "No \"version\" in package.json");

    if(!packageConfigs.name)
        return console.log('\x1b[31m%s\x1b[0m', "No \"name\" in package.json");

    console.log('\x1b[33m%s\x1b[0m', "You are about to deploy " + packageConfigs.name + " v" + packageConfigs.version);
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

    // path where the build app files with be
    const serverPath = config.appDir + "/" + packageConfigs.name ;
    // add to that the version number as directory
    const serverPathDist = serverPath + "/" + packageConfigs.version;
    /*
    * e.g.,
    * /home
    * |_ /project
    *    |_ /0.0.1
    *    |  |_ index.js
    *    |  |_ /public
    *    |     |_ ...
    *    |_ /0.0.2
    *    |  |_ index.js
    *    |  |_ /public
    *    |     |_ ...
    * ...
     */

    // check if version was already deployed
    let mustOverWriteCurrentVersion = false;
    if(await sftp.exists(serverPathDist)){
        console.log('\x1b[33m%s\x1b[0m', "Version " + packageConfigs.version + " is already deployed");
        if(!await askToContinue("Overwrite [" + serverPathDist + "]")) {
            await sftp.end();
            return;
        }

        mustOverWriteCurrentVersion = true;
    }

    if(!config.skipTest && !await runTests())
        return;

    // check if docker is installed on remote
    if(!await isDockerInstalledOnRemote(sftp.client)) {
        console.log('\x1b[33m%s\x1b[0m', "You are about to install Docker on your remote host");
        if(!await askToContinue("Continue"))
            return;

        await installDocker(sftp.client, !config.rootless);
        if(!await isDockerInstalledOnRemote(sftp.client))
            return console.log('\x1b[31m%s\x1b[0m', "Could not install Docker on remote host");
    }

    // clean build
    await build(config);

    // predeploy script
    await execScript(path.resolve(config.src, "predeploy.ts"), config);

    if(mustOverWriteCurrentVersion)
        await sftp.rmdir(serverPathDist, true);

    await sftp.mkdir(serverPathDist, true);

    await deployDockerCompose(config, sftp, serverPath, serverPathDist, packageConfigs.name);

    await sftp.end();

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', packageConfigs.name + " v" + packageConfigs.version + " deployed!");

    // post deploy script
    await execScript(path.resolve(config.src, "postdeploy.ts"), config);

    process.exit(0);
}
