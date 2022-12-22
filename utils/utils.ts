import path, {dirname, resolve} from "path";
import fs from "fs";
import {createInterface, clearLine as rlClearLine, cursorTo} from "readline";
import os from "os";
import {execSync} from "child_process";
import {build, BuildOptions, buildSync} from "esbuild";
import {Socket} from "net";
import SFTP from "ssh2-sftp-client";
import yaml from "js-yaml";
import glob from "glob";
import {WrappedSFTP} from "../commands/deploy";
import crypto from "crypto";
import {sshCredentials} from "../types/deploy";
import {FullStackedConfig} from "../index";
import * as process from "process";


// ask a question, resolve string answer
export function askQuestion(question: string, hideStdin: boolean = false): Promise<string>{
    const rl : any = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        rl.stdoutMuted = hideStdin;

        rl.question(question, (input) => {
            rl.close();
            resolve(input);
        });

        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            if (!rl.stdoutMuted) rl.output.write(stringToWrite);
        };
    });
}

// simple y/n console input
export async function askToContinue(question: string): Promise<boolean> {
    if(process.argv.includes("--y")) return true;

    const answer = await askQuestion(question + ' (y/n): ');
    return answer === "y" || answer === "Y" || answer === "yes";
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
    // hack for JetBrain WebStorm to print out when using test panel
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
        outfile: (entrypoint.endsWith("x") ? entrypoint.slice(0, -3) : entrypoint.slice(0, -2)) + "js",
        platform: "node",
        format: "esm",
        sourcemap: true
    }
}

// exec command on remote host over ssh
export function execSSH(ssh2, cmd, logger?: (str) => void): Promise<string>{
    return new Promise(resolve => {
        let message = "";
        ssh2.exec(cmd, (err, stream) => {
            if (err) throw err;

            stream.on('data', data => {
                if(logger) logger(data.toString());

                message += data.toString();
            });
            stream.on('error', data => {
                if(logger) logger(data.toString());

                message += data.toString();
            })
            stream.on('close', () => resolve(message));
        });
    });
}

// exec filename.ts(x) and *.filename.ts(x) file
export async function execScript(filePath: string, config: FullStackedConfig, ...args): Promise<void> {
    const filePathComponents = filePath.split(path.sep)
    const fileName = filePathComponents.pop().split(".").shift();

    let filesToRun = glob.sync("*." + fileName + ".ts", {cwd: filePathComponents.join(path.sep)})
        .map(file => filePathComponents.join(path.sep) + path.sep + file);
    filesToRun = filesToRun.concat(glob.sync("*." + fileName + ".tsx", {cwd: filePathComponents.join(path.sep)})
        .map(file => filePathComponents.join(path.sep) + path.sep + file))
    if(fs.existsSync(filePath)) filesToRun.push(filePath);
    if(!filePath.endsWith("x") && fs.existsSync(filePath + "x")) filesToRun.push(filePath + "x");

    if(!filesToRun.length) return;

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

        const outfile = esbuildConfig.outfile
            // windows paths...
            .replace(/C:/, "").replace(/\\/, "/");

        const importedModule = await import(outfile);
        if(typeof importedModule.default === 'function'){
            const functionReturn = importedModule.default(config, ...args);
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


export async function getSFTPClient(sshCredentials: sshCredentials): Promise<WrappedSFTP>{
    const sftp = new SFTP();

    if(sshCredentials.privateKeyFile)
        sshCredentials.privateKey = fs.readFileSync(path.resolve(process.cwd(), sshCredentials.privateKeyFile));

    await sftp.connect(sshCredentials);

    return sftp as WrappedSFTP;
}

export function getVolumesToBackup(dockerComposeStr: string, volumesAsked?: string | string[]): string[]{
    const dockerCompose = yaml.load(dockerComposeStr) as any;
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



// get data detail in fullchain cert
export function getCertificateData(fullchain){
    const cert = new crypto.X509Certificate(fullchain);
    return {
        subject: cert.subject,
        validTo: cert.validTo,
        subjectAltName: cert.subjectAltName
    };
}


const algorithm = 'aes-256-cbc';

export function loadDataEncryptedWithPassword(filePath: string, password: string){
    if(!fs.existsSync(filePath))
        throw Error(`Trying to load ${filePath}, but does not exists.`);

    const hashedParts = fs.readFileSync(filePath).toString().split(":");
    const hashedIv = hashedParts.shift();
    const encryptedData = hashedParts.join(":");

    const iv = Buffer.from(hashedIv, 'hex');
    const encryptedText = Buffer.from(encryptedData, 'hex');

    const key = crypto.createHash('md5').update(password).digest("hex");

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    try{
        return JSON.parse(decrypted.toString());
    }catch (e) {
        throw Error("Wrong password or corrupt file");
    }
}

export function saveDataEncryptedWithPassword(filePath: string, password: string, data: any){
    const key = crypto.createHash('md5').update(password).digest("hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    fs.writeFileSync(filePath, iv.toString('hex') + ":" + encrypted.toString('hex'));
}


export async function maybePullDockerImage(docker, image){
    try{
        await (await docker.getImage(image)).inspect();
    }catch (e){
        const pullStream = await docker.pull(image);
        await new Promise<void>(resolve => {
            pullStream.on("data", dataRaw => {
                const dataParts = dataRaw.toString().match(/{.*}/g);
                dataParts.forEach((part) => {
                    const {status, progress} = JSON.parse(part);
                    printLine(`[${image}] ${status} ${progress || " "}`);
                });

            })
            pullStream.on("end", () => {
                clearLine();
                resolve();
            });
        });
    }
}


export function getBuiltDockerCompose(srcDir: string, production: boolean = false){
    let dockerCompose: any = {
        services: {
            node: {
                image: 'node:18-alpine',
                working_dir: '/app',
                command: [
                    'index.mjs',
                    (!production ? "--development" : "")
                ],
                restart: "unless-stopped",
                expose: ["80"],
                ports: ["80"],
                volumes: [`./app:/app`]
            }
        }
    }

    const ignore = [
        "**/node_modules/**",
        "**/dist/**"
    ];

    process.argv.forEach(arg => {
        if(!arg.startsWith("--ignore=")) return;

        ignore.push(...arg.slice("--ignore=".length).split(","));
    });

    const dockerComposeFiles = [
        ...glob.sync(resolve(srcDir, "**", "docker-compose.yml"), {ignore}),
        ...glob.sync(resolve(srcDir, "**", "*.docker-compose.yml"), {ignore})
    ];

    const dockerComposeRootAttributes = [
        "services",
        "volumes",
        "networks"
    ]
    dockerComposeFiles.forEach(dockerComposeFilePath => {
        const serviceDockerCompose: any = yaml.load(fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"}));

        dockerComposeRootAttributes.forEach(attribute => {
            dockerCompose[attribute] = {
                ...dockerCompose[attribute],
                ...serviceDockerCompose[attribute]
            }
        });
    });

    return dockerCompose;
}


export async function recursivelyBuildTS(entrypoint: string, outDir?: string){
    const buildOptions = defaultEsbuildConfig(entrypoint);

    if(outDir){
        buildOptions.outfile = resolve(outDir, buildOptions.outfile.replace(process.cwd(), "").slice(1));
    }

    await build({
        ...buildOptions,
        bundle: true,
        allowOverwrite: true,
        plugins: [{
            name: "recursive-buillder",
            setup(currentBuild){
                currentBuild.onResolve({filter: /.*/}, async (args) => {
                    if(args.kind === "entry-point") return null;

                    if(!args.path.endsWith(".js") || !args.path.startsWith(".")) return {external: true};

                    const filePathToBuild = resolve(path.dirname(currentBuild.initialOptions.entryPoints[0]), args.path);
                    await recursivelyBuildTS(filePathToBuild, outDir)

                    return {external: true};
                })
            }
        }]
    })
}

export function getExternalModules(srcDir: string){
    const ignoreFilePath = resolve(srcDir, "ignore.json");
    const nativeFilePath = resolve(srcDir, "server", "native.json");

    const hasIgnoredModules = fs.existsSync(ignoreFilePath);
    const hasNativeModules = fs.existsSync(nativeFilePath);

    if(!hasIgnoredModules && !hasNativeModules) return [];

    let ignoredModules = [];

    if(hasIgnoredModules){
        try{
            const {ignore} = JSON.parse(fs.readFileSync(ignoreFilePath, {encoding: "utf8"}));
            ignoredModules = ignore;
        }catch (e){
            console.log(e);
        }
    }

    if(hasNativeModules){
        let nativeModules;
        try{
            nativeModules = JSON.parse(fs.readFileSync(nativeFilePath, {encoding: "utf8"}));
        }catch (e){
            console.log(e);
        }
        ignoredModules.push(...Object.keys(nativeModules));
    }

    return ignoredModules;
}
