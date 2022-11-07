import path from "path";
import fs from "fs";
import {createInterface, clearLine as rlClearLine, cursorTo} from "readline";
import os from "os";
import {execSync} from "child_process";
import {BuildOptions, buildSync} from "esbuild";
import {Socket} from "net";
import {FullStackedConfig} from "../index";
import SFTP from "ssh2-sftp-client";
import yaml from "yaml";
import glob from "glob";

// ask a question, resolve string answer
export function askQuestion(question: string): Promise<string>{
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        rl.question(question, (input) => {
            rl.close();
            resolve(input);
        });
    });
}

// simple y/n console input
export async function askToContinue(question: string): Promise<boolean> {
    if(process.argv.includes("--y")) return true;

    const answer = await askQuestion(question + ' (y/n): ');
    return answer === "y" || answer === "Y" || answer === "yes";
}

// get package json data from package.json at project root
export function getPackageJSON():{[key:string]: any} {
    const packageJSONPath = path.resolve(process.cwd(), "package.json");
    if(!fs.existsSync(packageJSONPath))
        throw Error("Cannot find package.json file. Please run fullstacked commands at your project root");

    return JSON.parse(fs.readFileSync(packageJSONPath, {encoding: "utf-8"}));
}

export function silenceCommandLine(cmd: string){
    if(os.platform() === "win32")
        return cmd + " >nul 2>nul";

    return cmd + " >/dev/null 2>&1";
}

// check if docker and docker-compose CLI is installed locally
export function isDockerInstalled(): boolean{
    const dockerVersion = execSync("docker -v").toString();
    if(dockerVersion === "")
        return false;

    const dockerComposeVersion = execSync("docker-compose -v").toString();
    return dockerComposeVersion !== "";
}

// print line at current cursor
export function printLine(line: string) {
    // hack for JetBrain WebStorm to printout when using test panel
    if(process.argv.includes("--grep"))
        return console.log(line);

    clearLine();
    process.stdout.write(line);
}

// clear line at cursor
export function clearLine() {
    rlClearLine(process.stdout, 0);
    cursorTo(process.stdout, 0, null);
}

// source: https://stackoverflow.com/a/22185855
export function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {

        if(!fs.existsSync(dest))
            fs.mkdirSync(dest);

        fs.readdirSync(src).forEach(function(childItemName) {
            copyRecursiveSync(path.join(src, childItemName),
                path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

export function defaultEsbuildConfig(entrypoint: string): BuildOptions {
    return {
        entryPoints: [entrypoint],
        outfile: entrypoint.endsWith("x") ? entrypoint.slice(0, -3) : entrypoint.slice(0, -2) + "js",
        platform: "node",
        format: "cjs",
        sourcemap: true
    }
}

// exec command on remote host over ssh
export function execSSH(ssh2, cmd): Promise<string>{
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

// exec filename.ts(x) and *.filename.ts(x) file
export async function execScript(filePath: string, config: Config, ...args): Promise<void> {
    const filePathComponents = filePath.split(path.sep)
    const fileName = filePathComponents.pop().split(".").shift();

    const filesToRun = glob.sync("*." + fileName + ".ts", {cwd: filePathComponents.join(path.sep)})
        .map(file => filePathComponents.join(path.sep) + path.sep + file);
    filesToRun.concat(glob.sync("*." + fileName + ".tsx", {cwd: filePathComponents.join(path.sep)})
        .map(file => filePathComponents.join(path.sep) + path.sep + file))
    if(fs.existsSync(filePath)) filesToRun.push(filePath);
    if(!filePath.endsWith("x") && fs.existsSync(filePath + "x")) filesToRun.push(filePath + "x");

    // build file on the fly
    const ranFiles = filesToRun.map(async file => {
        const esbuildConfig = defaultEsbuildConfig(file);
        buildSync(esbuildConfig);

        // with test-mode, add istanbul ignore so the code coverage wont fail to parse deleted files
        if(process.argv.includes("--test-mode")) {
            const fileContent = fs.readFileSync(esbuildConfig.outfile, {encoding: "utf8"});
            fs.writeFileSync(esbuildConfig.outfile, `/* istanbul ignore file */
${fileContent}`);
        }

        const importedScript = require(esbuildConfig.outfile);
        if(typeof importedScript.default === 'function'){
            const functionReturn = importedScript.default(config, ...args);
            if(functionReturn instanceof Promise)
                await functionReturn;
        }
        deleteBuiltTSFile(file);
    });
    await Promise.all(ranFiles);
}

// delete .js and .js.map file
export function deleteBuiltTSFile(filePath: string){
    if(fs.existsSync(filePath.slice(0, -2) + "js")) fs.rmSync(filePath.slice(0, -2) + "js");
    if(fs.existsSync(filePath.slice(0, -2) + "js.map")) fs.rmSync(filePath.slice(0, -2) + "js.map");
}

// simple rm -rf
export function cleanOutDir(dir){
    if(!fs.existsSync(dir))
        return;
    fs.rmSync(dir, {force: true, recursive: true});
}

// source: https://stackoverflow.com/a/66116887
export function getNextAvailablePort(port: number = 8000): Promise<number> {
    return new Promise((resolve, reject) => {
        const socket = new Socket();

        const timeout = () => {
            resolve(port);
            socket.destroy();
        };

        const next = () => {
            socket.destroy();
            resolve(getNextAvailablePort(++port));
        };

        setTimeout(timeout, 200);
        socket.on("timeout", timeout);

        socket.on("connect", function () {
            next();
        });

        socket.on("error", function (exception) {
            if ((exception as any).code !== "ECONNREFUSED") {
                reject(exception);
            } else {
                timeout();
            }
        });

        socket.connect(port, "0.0.0.0");
    });
}

// source : https://stackoverflow.com/a/1349426
export function randStr(length) {
    let result           = '';
    const characters       = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}


export async function getSFTPClient(config: FullStackedConfig){
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
        connectionConfig.privateKey = config.privateKey;

    if(config.privateKeyFile)
        connectionConfig.privateKey = fs.readFileSync(path.resolve(process.cwd(), config.privateKeyFile));

    await sftp.connect(connectionConfig);

    return sftp;
}

export function getVolumesToBackup(dockerComposeStr: string, volumesAsked?: string | string[]): string[]{
    const dockerCompose = yaml.parse(dockerComposeStr);
    const volumes = Object.keys(dockerCompose.volumes);

    if(!volumes.length)
        throw new Error("No volumes in docker-compose file");

    const volumesToBackup = volumesAsked ?
        Array.isArray(volumesAsked)
            ? volumesAsked
            : [volumesAsked]
        : volumes;

    for (const volume of volumesToBackup) {
        if(!volumes.includes(volume))
            throw new Error(`Could not find volume ${volume} in docker-compose file`);
    }

    return volumesToBackup;
}
