import {buildSync} from "esbuild";
import Module from "module";
import path from "path";
import fs from "fs";
import axios from "axios";
import {getProjectRoot} from "./utils";

axios.defaults.baseURL = 'http://localhost:8000';

const fullstackedRoot = path.resolve(__dirname, "..");
const tsConfig = JSON.parse(fs.readFileSync(fullstackedRoot + "/tsconfig.json", {encoding: "utf8"}));

const projectRoot = getProjectRoot();

// source: https://stackoverflow.com/a/34186494
const originalRequire = Module.prototype.require;
//@ts-ignore
Module.prototype.require = function(){
    let filePath = arguments["0"];
    let mustBeBuilt = false;

    if(filePath.endsWith(".ts") && fs.existsSync(filePath))
        mustBeBuilt = true;

    if(!mustBeBuilt && filePath.startsWith("./") && fs.existsSync(path.resolve(this.path, filePath + ".ts"))){
        filePath = path.resolve(this.path, filePath + ".ts");
        mustBeBuilt = true;
    }

    if(!mustBeBuilt && !this.id.includes("node_modules") && fs.existsSync(path.resolve(projectRoot, filePath + ".ts"))){
        filePath = path.resolve(projectRoot, filePath + ".ts");
        mustBeBuilt = true;
    }

    if(Object.keys(tsConfig.compilerOptions.paths).includes(filePath)){
        filePath = path.resolve(fullstackedRoot, tsConfig.compilerOptions.baseUrl, tsConfig.compilerOptions.paths[filePath][0]);
        mustBeBuilt = true
    }

    if(mustBeBuilt) {
        buildSync({
            entryPoints: [filePath],
            outfile: filePath.slice(0, -2) + "js",
            format: "cjs",
            sourcemap: true
        });

        arguments["0"] = filePath.slice(0, -2) + "js";
    }

    return originalRequire.apply(this, arguments);
};
