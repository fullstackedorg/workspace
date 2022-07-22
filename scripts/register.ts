import {buildSync} from "esbuild";
import Module from "module";
import path from "path";
import fs from "fs";
import axios from "axios";
import {defaultEsbuildConfig} from "./utils";

axios.defaults.baseURL = 'http://localhost:8000';

const fullstackedRoot = path.resolve(__dirname, "..");
const tsConfig = JSON.parse(fs.readFileSync(fullstackedRoot + "/tsconfig.json", {encoding: "utf8"}));

// overriding require method
// this allows to run .ts file with node by building them with esbuild on the fly
// source: https://stackoverflow.com/a/34186494
const originalRequire = Module.prototype.require;
//@ts-ignore
Module.prototype.require = function(){
    let filePath = arguments["0"];
    let mustBeBuilt = false;

    if(filePath.endsWith(".ts") && fs.existsSync(filePath))
        mustBeBuilt = true;

    // if relative path and .ts file exist, then build
    if(!mustBeBuilt && (filePath.startsWith("./") || filePath.startsWith("../")) && fs.existsSync(path.resolve(this.path, filePath + ".ts"))){
        filePath = path.resolve(this.path, filePath + ".ts");
        mustBeBuilt = true;
    }

    // check if file exist and is not a node_module
    if(!mustBeBuilt && !this.id.includes("node_modules") && fs.existsSync(path.resolve(process.cwd(), filePath + ".ts"))){
        filePath = path.resolve(process.cwd(), filePath + ".ts");
        mustBeBuilt = true;
    }

    // check if there is a path alias
    if(Object.keys(tsConfig.compilerOptions.paths).includes(filePath)){
        filePath = path.resolve(fullstackedRoot, tsConfig.compilerOptions.baseUrl, tsConfig.compilerOptions.paths[filePath][0]);
        mustBeBuilt = true;
    }

    // build change .ts end for .js
    if(mustBeBuilt) {
        arguments["0"] = filePath.slice(0, -2) + "js";

        if(process.argv.includes("--test-mode"))
            return originalRequire.apply(this, arguments);

        buildSync(defaultEsbuildConfig(filePath));
    }

    return originalRequire.apply(this, arguments);
};
