import SFTP from "ssh2-sftp-client";
import path from "path";
import fs from "fs";
import glob from "glob";
import {askToContinue, execScript, execSSH, printLine} from "./utils";
import build from "./build";
import test from "./test";

/*
*
* 1. check requirements (package.json [name, version, etc])
* 2. try to connect to remote host
* 3. check if app at version already deployed
* 3. check if docker and docker-compose is installed
* 4. run tests
* 5. ship nginx docker-compose and nginx.conf
* 6. ship built app
* 7. up built app
* 8. up nginx
* 9. save relevant stuff for next deployment
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

async function  runTests(config: Config){
    console.log('\x1b[32m%s\x1b[0m', "Launching Tests!");

    try{
        await test(config);
    }catch (e) {
        throw e;
    }

    return true;
}

// prepare docker compose file for deployment
function setupDockerComposeFile(config){
    const outFile = path.resolve(config.out, "docker-compose.yml");
    const builtComposeFile = path.resolve(config.out, "docker-compose.yml");

    let content = fs.readFileSync(builtComposeFile, {encoding: "utf-8"});

    content = content.replace("8000:8000", `${config.port ?? 8000}:8000`);
    content = content.replace("./:/dist", `./${config.version}:/dist`);

    fs.writeFileSync(outFile, content);
    return outFile;
}

function setupNginxFile(config: Config){
    const outFile = config.out + "/nginx.conf";
    const nginxFileTemplate = path.resolve(__dirname, "../nginx.conf");
    let content = fs.readFileSync(nginxFileTemplate, {encoding: "utf-8"});

    const port = config.port ?? "8000";
    content = content.replace(/\{PORT\}/g, port);
    content = content.replace(/\{SERVER_NAME\}/g, config.serverName ?? "localhost");
    content = content.replace(/\{APP_NAME\}/g, config.name);
    content = content.replace(/\{VERSION\}/g, config.version);

    fs.writeFileSync(outFile, content);
    return outFile;
}

// deploy app using docker compose
async function deployDockerCompose(config: Config, sftp, serverPath, serverPathDist){
    const dockerComposeFilePath = setupDockerComposeFile(config);
    await sftp.put(dockerComposeFilePath, serverPath + "/docker-compose.yml");
    fs.rmSync(dockerComposeFilePath);

    const nginxFilePath = setupNginxFile(config);
    await sftp.put(nginxFilePath, serverPath + "/nginx.conf");
    fs.rmSync(nginxFilePath);

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

    console.log('\x1b[33m%s\x1b[0m', "Starting app");
    // exec start command
    await execSSH(sftp.client, `docker-compose -p ${config.name} -f ${serverPath}/docker-compose.yml up -d`);
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
    const serverPath = config.appDir + "/" + config.name ;
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

    if(!config.skipTest && !await runTests(config))
        return;

    if(!await sftp.exists(config.appDir))
        await sftp.mkdir(config.appDir, true);

    await Promise.all([
        sftp.put(path.resolve(__dirname, "../nginx/docker-compose.yml"), config.appDir + "/docker-compose.yml"),
        sftp.put(path.resolve(__dirname, "../nginx/nginx.conf"), config.appDir + "/nginx.conf")
    ]);

    // clean build
    await build(config);

    // predeploy script
    await execScript(path.resolve(config.src, "predeploy.ts"), config, sftp);

    if(mustOverWriteCurrentVersion)
        await sftp.rmdir(serverPathDist, true);

    await sftp.mkdir(serverPathDist, true);

    await execSSH(sftp.client, `openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ${serverPathDist}/key.pem -out ${serverPathDist}/cert.pem -days 365`);

    await deployDockerCompose(config, sftp, serverPath, serverPathDist);

    await execSSH(sftp.client, `docker-compose -p fullstacked-nginx -f ${config.appDir}/docker-compose.yml up -d`);
    await execSSH(sftp.client, `docker-compose -p fullstacked-nginx -f ${config.appDir}/docker-compose.yml restart`);

    await sftp.end();

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', config.name + " v" + config.version + " deployed!");

    // post deploy script
    await execScript(path.resolve(config.src, "postdeploy.ts"), config);

    process.exit(0);
}
