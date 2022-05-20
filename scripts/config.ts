import {getPackageJSON} from "./utils";

const defaultConfig: Config = {
    src: process.cwd(),
    out: process.cwd(),
    appDir: "/home"
}

export default function(config) {
    config = {
        ...defaultConfig,
        ...config
    }

    config.out += "/dist"

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

    optionalConfig.forEach(key => {
        config[key] = config[key] ?? packageConfigs[key];
    });



    return config;
}
