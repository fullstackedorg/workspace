import SFTP from "ssh2-sftp-client";
import path from "path";
import fs from "fs";
import rlp from "readline";
import glob from "glob";
import build from "./build";

function askToContinue(question) {
    const rl = rlp.createInterface({
        input: process.stdin,
        output: process.stdout

    });

    return new Promise((resolve, reject) => {
        rl.question(question + ' (y/n): ', (input) => {
            rl.close();
            resolve(input === "y" || input === "Y" || input === "yes");
        });
    });
}

function getPackageJSON(projectRoot){
    const possibleLocation = [
        path.resolve(projectRoot, "package.json"),
        path.resolve(process.cwd(), projectRoot, "package.json"),
        path.resolve(process.cwd(), projectRoot)
    ];

    let packageJSONFile = "";
    for (let i = 0; i < possibleLocation.length; i++) {
        if(fs.existsSync(possibleLocation[i]) && possibleLocation[i] !== "/package.json") {
            packageJSONFile = possibleLocation[i];
            break;
        }
    }

    if(!packageJSONFile)
        return false;

    return JSON.parse(fs.readFileSync(packageJSONFile, {encoding: "utf-8"}));
}

function setupDockerComposeFile(config){
    const outFile = config.out + "/docker-compose.yml";
    fs.copyFileSync(path.resolve(__dirname, "../docker-compose.yml"), outFile);

    const content = fs.readFileSync(outFile, {encoding: "utf-8"});

    fs.writeFileSync(outFile, content.replace("${PORT}", config.port));
}

function execSSH(ssh2, cmd){
    return new Promise(resolve => {
        ssh2.exec(cmd, (err, stream) => {

            if (err) throw err;

            stream.on('data', console.log);
            stream.on('close', resolve);
        });
    });
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
    const packageConfigs = getPackageJSON(config.root);
    if(!packageConfigs) {
        console.log('\x1b[31m%s\x1b[0m', "Could not find package.json file");
        return;
    }

    if(!packageConfigs.version) {
        console.log('\x1b[31m%s\x1b[0m', "No \"version\" in package.json");
        return;
    }

    if(!packageConfigs.name) {
        console.log('\x1b[31m%s\x1b[0m', "No \"name\" in package.json");
        return;
    }

    console.log('\x1b[33m%s\x1b[0m', "You are about to deploy " + packageConfigs.name + " v" + packageConfigs.version);
    if(!await askToContinue("Continue"))
        return;

    await build(config);

    const sftp = new SFTP();
    await sftp.connect({
        host: config.host,
        username: config.user,
        password: config.pass
    });

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

    await launchDockerCompose(sftp, packageConfigs, serverPath, serverPathDist);

    await sftp.end();

    console.log('\x1b[32m%s\x1b[0m', packageConfigs.name + " v" + packageConfigs.version + " deployed!")
}
