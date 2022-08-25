import {getPackageJSON} from "./utils";
import path from "path";
import crypto from "crypto";
import {execSync} from "child_process";

const defaultConfig: Config = {
    src: process.cwd(),
    out: process.cwd(),
    appDir: "/home"
}

function getGitShortCommitHash(){
    try{
        return execSync("git rev-parse --short HEAD").toString().trim();
    }
    catch (e){
        return ""
    }
}

export default function(config) {
    // spread defaults with values caught in flags
    config = {
        ...defaultConfig,
        ...config
    }

    // always add dist to the out dir
    config.dist = path.resolve(config.out, "dist");

    // force to have a package.json
    const packageConfigs = getPackageJSON();
    if(Object.keys(packageConfigs).length === 0)
        throw Error("Could not find package.json file or your package.json is empty");

    const requiredConfig = ["name", "version"];
    const optionalConfig = ["title"];

    requiredConfig.forEach(key => {
        config[key] = config[key] ?? packageConfigs[key];
        if(!config[key])
            throw Error("Missing config " + key + " from package.json or command line args");
    });

    // always add version number to the out folder
    config.out = path.resolve(config.dist, config.version);
    config.public = path.resolve(config.out, "public");

    optionalConfig.forEach(key => {
        config[key] = config[key] ?? packageConfigs[key];
    });

    if(!config.hash){
        config.hash = getGitShortCommitHash() ?? crypto.randomBytes(7).toString('hex');
    }

    return config;
}
