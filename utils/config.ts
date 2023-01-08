import path from "path";
import crypto from "crypto";
import {execSync} from "child_process";
import Docker from "./docker";
import getPackageJSON from "./getPackageJSON";
import {FullStackedConfig} from "../index";

const defaultConfig = root => ({
    src: root ?? process.cwd(),
    out: root ?? process.cwd(),
    appDir: "/home"
})

function getGitShortCommitHash(){
    try{
        const commitHash = execSync("git rev-parse --short HEAD", {stdio: "ignore"}).toString().trim();
        return commitHash.startsWith("fatal") ? "" : commitHash;
    }
    catch (e){
        return ""
    }
}

export default async function(config) {
    // spread defaults with values caught in flags
    config = {
        ...defaultConfig(config.root),
        ...config,
        docker: config.testMode ? null : await Docker()
    }

    // always add dist to the out dir
    config.dist = path.resolve(config.out, "dist");

    // force to have a package.json
    const packageConfigs = getPackageJSON(config.root);
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
    config.out = path.resolve(config.dist, "app");
    config.public = path.resolve(config.out, "public");

    optionalConfig.forEach(key => {
        config[key] = config[key] ?? packageConfigs[key];
    });

    if(!config.hash){
        config.hash = getGitShortCommitHash() || crypto.randomBytes(4).toString('hex');
    }

    return config;
}
