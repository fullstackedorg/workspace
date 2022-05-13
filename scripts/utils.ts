import path from "path";
import fs from "fs";
import rlp from "readline";
import glob from "glob";
import os from "os";
import {exec, execSync} from "child_process";

export function askToContinue(question): Promise<boolean> {
    const rl = rlp.createInterface({
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

async function askIfProjectPackageJSON(paths: string[]): Promise<string>{
    for (let i = 0; i < paths.length; i++) {
        if(fs.existsSync(paths[i]) && await askToContinue("Is this your projects package.json : " + paths[i]))
            return paths[i];
    }
    return null;
}

export async function getPackageJSON(expectedPath: string = ""): Promise<{[key:string]: any}>{
    if(expectedPath){
        const testPaths = [
            expectedPath,
            path.resolve(expectedPath, "package.json"),
            path.resolve(process.cwd(), expectedPath, "package.json")
        ]

        for (let i = 0; i < testPaths.length; i++) {
            if(fs.existsSync(testPaths[i]) && testPaths[i] !== "/package.json" && !fs.statSync(testPaths[i]).isDirectory())
                return JSON.parse(fs.readFileSync(testPaths[i], {encoding: "utf8"}));
        }
    }

    const savedPathCacheFile = path.resolve(process.cwd(), ".packagePath");
    if(fs.existsSync(savedPathCacheFile)){
        const savedPath = fs.readFileSync(savedPathCacheFile, {encoding: "utf8"});
        if(fs.existsSync(savedPath) && !fs.statSync(savedPath).isDirectory())
            return JSON.parse(fs.readFileSync(savedPath, {encoding: "utf8"}));
    }

    const pathComponent = process.cwd().split("/");
    let depth = 0, packageJSONPath = "";
    while(depth < 10){
        if(depth < pathComponent.length){
            const testPathUP = glob.sync(pathComponent.slice(0, -(depth ? depth : undefined)).join("/") + "/package.json");
            packageJSONPath = await askIfProjectPackageJSON(testPathUP);
            if(packageJSONPath) break;
        }

        const testPathDOWN = glob.sync(process.cwd() + new Array(depth).fill("/*").join("") + "/package.json");
        packageJSONPath = await askIfProjectPackageJSON(testPathDOWN);
        if(packageJSONPath) break;

        depth++;
    }

    if(fs.existsSync(packageJSONPath)) {
        fs.writeFileSync(".packagePath", packageJSONPath);
        return JSON.parse(fs.readFileSync(packageJSONPath, {encoding: "utf8"}));
    }

    return {};
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
