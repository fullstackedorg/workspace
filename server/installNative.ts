import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {readFileSync} from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function installNativeModules(){
    let nativeModules;
    try{
        nativeModules = JSON.parse(readFileSync(resolve(__dirname, "native.json"), {encoding: "utf-8"}))
    }catch (e) {
        console.log("Unable to read native.json. Skipping...")
        return;
    }

    execSync(`npm i ${Object.keys(nativeModules).map(nativeModule => nativeModule + "@" + nativeModules[nativeModule]).join(" ")}`,
        {stdio: process.argv.includes("--development") ? "inherit" : "ignore"});
}

installNativeModules();
