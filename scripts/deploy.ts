import SFTP from "ssh2-sftp-client";
import path from "path";
import fs from "fs";
import glob from "glob";
import {askToContinue, getPackageJSON} from "./utils";
import build from "./build";

function setupDockerComposeFile(config){
    const outFile = config.out + "/docker-compose.yml";
    fs.copyFileSync(path.resolve(__dirname, "../docker-compose.yml"), outFile);

    let content = fs.readFileSync(outFile, {encoding: "utf-8"});

    content = content.replace("${PORT}", config.port ?? 80);
    content = content.replace("${PORT_HTTPS}", config.portHTTPS ?? 443);

    fs.writeFileSync(outFile, content);
}

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

async function isDockerInstalled(ssh2): Promise<boolean>{
    const dockerVersion = await execSSH(ssh2, "docker -v");
    return dockerVersion !== "";
}

async function installDocker(ssh2){
    await execSSH(ssh2, "sudo yum install docker -y");
    await execSSH(ssh2, "sudo wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)");
    await execSSH(ssh2, "sudo mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose");
    await execSSH(ssh2, "sudo chmod -v +x /usr/local/bin/docker-compose");
    await execSSH(ssh2, "sudo systemctl enable docker.service");
    await execSSH(ssh2, "sudo systemctl start docker.service");
    await execSSH(ssh2, "sudo chmod 666 /var/run/docker.sock");
}

async function launchDockerCompose(sftp, packageConfigs, serverPath, serverDistPath){
    const savedDown = serverPath + "/down.txt";
    if(await sftp.exists(savedDown)){
        const command = (await sftp.get(savedDown)).toString().trim();
        if(command.startsWith("docker-compose") && command.endsWith("down -v")) {
            console.log('\x1b[33m%s\x1b[0m', "Stopping current running app");
            await execSSH(sftp.client, command);
        }
    }

    const cmdUP = `docker-compose -p ${packageConfigs.name} -f ${serverDistPath}/docker-compose.yml up -d`;
    const cmdDOWN = `docker-compose -p ${packageConfigs.name} -f ${serverDistPath}/docker-compose.yml down -v`;

    console.log('\x1b[33m%s\x1b[0m', "Starting app");
    await execSSH(sftp.client, cmdUP);
    await execSSH(sftp.client, `echo "${cmdDOWN}" > ${savedDown}`);
}

function printProgress(progress){
    process.stdout.clearLine(-1);
    process.stdout.cursorTo(0);
    process.stdout.write(progress);
}

export default async function (config) {
    const packageConfigs = await getPackageJSON();
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

    if(config.pass)
        connectionConfig.password = config.pass;

    if(config.privateKey)
        connectionConfig.privateKey = fs.readFileSync(path.resolve(process.cwd(), config.privateKey));

    await sftp.connect(connectionConfig);

    const dockerInstalled = await isDockerInstalled(sftp.client);

    if(!dockerInstalled) {
        console.log('\x1b[33m%s\x1b[0m', "You are about to install Docker on your remote host");
        if(!await askToContinue("Continue"))
            return;

        await installDocker(sftp.client);
        if(!await isDockerInstalled(sftp.client))
            return console.log('\x1b[31m%s\x1b[0m', "Could not install Docker on remote host");
    }

    await build(config);

    const serverPath = config.appDir + "/" + packageConfigs.name ;
    const serverPathDist = serverPath + "/" + packageConfigs.version;

    if(await sftp.exists(serverPathDist)){
        console.log('\x1b[33m%s\x1b[0m', "Version " + packageConfigs.version + " is already deployed");
        if(!await askToContinue("Overwrite [" + serverPathDist + "]")) {
            await sftp.end();
            return;
        }

        await sftp.rmdir(serverPathDist, true);
    }

    await sftp.mkdir(serverPathDist, true);

    setupDockerComposeFile(config);

    const files = glob.sync("**/*", {cwd: config.out})
    const localFilePaths = files.map(file => path.resolve(process.cwd(), config.out, file));

    for (let i = 0; i < files.length; i++) {
        const fileInfo = fs.statSync(localFilePaths[i]);
        if(fileInfo.isDirectory())
            await sftp.mkdir(serverPathDist + "/" + files[i]);
        else
            await sftp.put(localFilePaths[i], serverPathDist + "/" + files[i]);

        printProgress("Progress: " + (i + 1) + "/" + files.length);
    }
    console.log('\x1b[32m%s\x1b[0m', "\nUpload completed");

    await execSSH(sftp.client, `openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ${serverPathDist}/key.pem -out ${serverPathDist}/cert.pem -days 365`)

    await launchDockerCompose(sftp, packageConfigs, serverPath, serverPathDist);

    await sftp.end();

    console.log('\x1b[32m%s\x1b[0m', packageConfigs.name + " v" + packageConfigs.version + " deployed!")
}
