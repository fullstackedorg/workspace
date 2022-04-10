import path from "path";
import fs from "fs";
import rlp from "readline";
import glob from "glob";
import os from "os";
import {execSync, spawn} from "child_process";

export function askToContinue(question) {
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

    if(os.platform() === 'win32' && process.pid)
        return spawn("taskkill", ["/pid", process.pid, '/f', '/t']);

    if(process.kill)
        process.kill();

    if(!port)
        return;

    let processAtPort;
    try{
        processAtPort = execSync(`lsof -t -i:${port}`);
    }catch (e) {}
    if(processAtPort)
        execSync(`kill -9 ${processAtPort.toString()}`);
}
