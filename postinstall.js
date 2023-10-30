import {existsSync} from "fs";
import {execSync} from "child_process";

if(existsSync("code-oss/package.json")){
    execSync("cd code-oss && npm i --legacy-peer-deps", {stdio: "inherit"});
}
