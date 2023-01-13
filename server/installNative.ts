import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {readFileSync} from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function installNativeModules(){
    let nativeModules: {[moduleName: string]: string};
    try{
        nativeModules = JSON.parse(readFileSync(resolve(__dirname, "native.json"), {encoding: "utf-8"}))
    }catch (e) {
        console.log("Unable to read native.json. Skipping...")
        return;
    }

    const uninstalledModules: string[] = (await Promise.all(Object.keys(nativeModules).map(nativeModule => new Promise<string>(async (resolve) => {
        try{
            await import(nativeModule)
        }catch (e) {
            resolve(nativeModule);
        }
        resolve("");
    })))).filter(Boolean);

    if(uninstalledModules.length === 0) return;

    execSync(`npm i ${uninstalledModules.map(nativeModule => nativeModule + "@" + nativeModules[nativeModule]).join(" ")}`,
        {stdio: process.argv.includes("--development") ? "inherit" : "ignore"});
}

(async () => await installNativeModules())();

