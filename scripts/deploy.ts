import SFTP from "ssh2-sftp-client";
import path from "path";
import fs from "fs";
import glob from "glob";
import {askToContinue, getPackageJSON, isDockerInstalled, printLine} from "./utils";
import build from "./build";
import {exec} from "child_process";
import yaml from "yaml";

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

async function isDockerInstalledOnRemote(ssh2): Promise<boolean>{
    const dockerVersion = await execSSH(ssh2, "docker -v");
    return dockerVersion !== "";
}

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

function setupDockerComposeFile(config){
    const outFile = config.out + "/docker-compose.yml";
    fs.copyFileSync(path.resolve(__dirname, "../docker-compose.yml"), outFile);

    let content = fs.readFileSync(outFile, {encoding: "utf-8"});

    content = content.replace("${PORT}", config.port ?? 80);

    if(config.portHTTPS){
        let yamlContent = yaml.parse(content);
        yamlContent.services.node.ports.push(config.portHTTPS + ":8443");
        content = yaml.stringify(yamlContent);
    }

    fs.writeFileSync(outFile, content);
}

async function deployDockerCompose(config: Config, sftp, serverPath, serverPathDist, appName){
    setupDockerComposeFile(config);

    const files = glob.sync("**/*", {cwd: config.out})
    const localFilePaths = files.map(file => path.resolve(process.cwd(), config.out, file));

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

function buildDockerImage(config: Config, dockerfileOutDir, appName){
    const dockerfileSrc = path.resolve(__dirname, "../Dockerfile");

    if(dockerfileSrc !== dockerfileOutDir + "/Dockerfile")
        fs.cpSync(dockerfileSrc, dockerfileOutDir + "/Dockerfile");

    return new Promise(resolve => {
        const dockerBuildProcess = exec(`docker build --output type=tar,dest=${dockerfileOutDir}/out.tar ${dockerfileOutDir} -t ${appName}`);
        if(!config.silent){
            dockerBuildProcess.stdout.pipe(process.stdout);
            dockerBuildProcess.stderr.pipe(process.stderr);
        }
        dockerBuildProcess.on('close', resolve);
        dockerBuildProcess.on('exit', resolve);
    });
}

async function deployDocker(config: Config, sftp, serverPath: string, serverPathDist: string, appName: string){
    if(!await isDockerInstalled()) {
        throw new Error("Docker is not installed on local machine. Consider using " +
            "\"npx fullstacked deploy --docker-compose\" to deploy using docker compose or install Docker.");
    }

    const dockerfileOutDir = path.resolve(config.out, "..");
    await buildDockerImage(config, dockerfileOutDir, appName);
    console.log('\x1b[32m%s\x1b[0m', "Uploading Built Docker image");
    await sftp.put(dockerfileOutDir + "/out.tar", serverPathDist + "/out.tar");
    fs.rmSync(dockerfileOutDir + "/out.tar");
    console.log('\x1b[33m%s\x1b[0m', "Loading Docker Image on remote host");
    await execSSH(sftp.client, `cat ${serverPathDist}/out.tar | docker ${config.dockerExtraFlags} import - ${appName}`);

    let ports = `-p ${config.port ?? 80}:8000`;

    if(config.portHTTPS)
        ports += ` -p ${config.portHTTPS}:8443 -v ${serverPathDist}:/keys`;

    const cmdUP = `docker run ${ports} --name ${appName} -d ${config.dockerExtraFlags} ${appName} node index`;
    const cmdDOWN = `docker rm -f ${appName}`;
    await startDeployment(config, cmdUP, cmdDOWN, sftp, serverPath, serverPathDist);
}

async function startDeployment(config: Config, cmdUP, cmdDOWN, sftp, serverPath, serverPathDist){
    const savedDown = serverPath + "/down.txt";
    if(await sftp.exists(savedDown)){
        const command = (await sftp.get(savedDown)).toString().trim();
        console.log('\x1b[33m%s\x1b[0m', "Stopping current running app");
        await execSSH(sftp.client, command);
    }

    if(config.portHTTPS)
        await execSSH(sftp.client, `openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ${serverPathDist}/key.pem -out ${serverPathDist}/cert.pem -days 365`);

    console.log('\x1b[33m%s\x1b[0m', "Starting app");
    await execSSH(sftp.client, cmdUP);
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

    const serverPath = config.appDir + "/" + packageConfigs.name ;
    const serverPathDist = serverPath + "/" + packageConfigs.version;

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

    const dockerInstalled = await isDockerInstalledOnRemote(sftp.client);

    if(!dockerInstalled) {
        console.log('\x1b[33m%s\x1b[0m', "You are about to install Docker on your remote host");
        if(!await askToContinue("Continue"))
            return;

        await installDocker(sftp.client, !config.rootless);
        if(!await isDockerInstalledOnRemote(sftp.client))
            return console.log('\x1b[31m%s\x1b[0m', "Could not install Docker on remote host");
    }

    await build(config);

    if(mustOverWriteCurrentVersion)
        await sftp.rmdir(serverPathDist, true);

    await sftp.mkdir(serverPathDist, true);

    if(config.dockerCompose)
        await deployDockerCompose(config, sftp, serverPath, serverPathDist, packageConfigs.name);
    else
        await deployDocker(config, sftp, serverPath, serverPathDist, packageConfigs.name);

    await sftp.end();

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', packageConfigs.name + " v" + packageConfigs.version + " deployed!");

    process.exit(0);
}
