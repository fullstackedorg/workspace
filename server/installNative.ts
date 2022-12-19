import {execSync} from "child_process";
//@ts-ignore
import nativeModules from "./native.json" assert { type: "json" };

execSync(`npm i ${Object.keys(nativeModules).map(nativeModule => nativeModule + "@" + nativeModules[nativeModule]).join(" ")}`,
    {stdio: process.argv.includes("--development") ? "inherit" : "ignore"});
