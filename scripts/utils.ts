import path from "path";
import fs from "fs";
import {createInterface, clearLine as rlClearLine, cursorTo} from "readline";
import os from "os";
import {exec, execSync} from "child_process";
import {BuildOptions, buildSync} from "esbuild";

export function askToContinue(question): Promise<boolean> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        if(process.argv.includes("--y")) return resolve(true);
        rl.question(question + ' (y/n): ', (input) => {
            rl.close();
            resolve(input === "y" || input === "Y" || input === "yes");
        });
    });
}

// get package json data from package.json at project root
export function getPackageJSON():{[key:string]: any} {
    const packageJSONPath = path.resolve(process.cwd(), "package.json");
    if(!fs.existsSync(packageJSONPath))
        throw Error("Cannot find package.json file. Please run fullstacked commands at your project root");

    return JSON.parse(fs.readFileSync(packageJSONPath, {encoding: "utf-8"}));
}

export async function killProcess(process, port: number = 0){
    if(!process)
        return;

    if(os.platform() === 'win32' && process.pid){
        if(process.pid)
            try{exec(`taskkill /pid ${process.pid} /f`)} catch (e) {}

        if(port){
            const processesAtPort = new Set(execSync(`netstat -ano | findstr :${port}`).toString()
                .split("\r\n")
                .filter(processLine => processLine.includes("LISTENING"))
                .map(processLine => processLine.match(/\d*$/))
                .filter(processMatch => processMatch && processMatch[0] !== "0")
                .map(processMatch => processMatch[0]));

            processesAtPort.forEach(processID => {
                try{exec(`taskkill /pid ${processID} /f`)} catch (e) {}
            });
        }

        return;
    }


    if(process.kill)
        process.kill();

    if(!port)
        return;

    let processesAtPort;
    try{
        processesAtPort = execSync(`lsof -t -i:${port}`);
    }catch (e) {}
    if(processesAtPort) {
        processesAtPort.toString().split("\n").filter(e => e !== "").forEach(processAtPort => {
            try {execSync(`kill -9 ${processAtPort.toString()}`)} catch (e) {}
        });
    }
}

export function sleep(ms: number){
    return new Promise<void>(resolve => {
        setTimeout(resolve, ms);
    });
}

export async function isDockerInstalled(): Promise<boolean>{
    const dockerVersion = execSync("docker -v").toString();
    return dockerVersion !== "";
}

export function printLine(line: string) {
    if(process.argv.includes("--grep"))
        return console.log(line);

    clearLine();
    process.stdout.write(line);
}

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
        outfile: entrypoint.slice(0, -2) + "js",
        format: "cjs",
        sourcemap: true
    }
}

export function execScript(filePath: string, args: any = null): Promise<void> {
    return new Promise(async resolve => {
        if(!fs.existsSync(filePath))
            return resolve();

        const config = defaultEsbuildConfig(filePath);
        buildSync(config);

        if(process.argv.includes("--test-mode")) {
            const fileContent = fs.readFileSync(config.outfile, {encoding: "utf8"});
            fs.writeFileSync(config.outfile, `/* istanbul ignore file */
${fileContent}`);
        }

        const importedScript = require(config.outfile);
        if(typeof importedScript.default === 'function'){
            const functionReturn = importedScript.default(args);
            if(functionReturn instanceof Promise)
                await functionReturn;
        }
        deleteBuiltTSFile(filePath);
        resolve();
    });
}

export function deleteBuiltTSFile(filePath: string){
    if(fs.existsSync(filePath.slice(0, -2) + "js")) fs.rmSync(filePath.slice(0, -2) + "js");
    if(fs.existsSync(filePath.slice(0, -2) + "js.map")) fs.rmSync(filePath.slice(0, -2) + "js.map");
}

export function cleanOutDir(dir){
    fs.rmSync(dir, {force: true, recursive: true});
}
