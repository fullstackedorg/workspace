#!/usr/bin/env node
import defaultConfig from "./scripts/config";

const scripts = {
    "create": "./scripts/create",
    "build" : "./scripts/build",
    "watch" : "./scripts/watch",
    "deploy": "./scripts/deploy",
    "test": "./scripts/test"
};
let script = "build"

let config: Config = {}
const args = {
    "--src=": value => config.src = value,
    "--out=": value => config.out = value,
    "--port=": value => config.port = value,
    "--host=": value => config.host = value,
    "--user=": value => config.user = value,
    "--pass=": value => config.pass = value,
    "--app-dir=": value => config.appDir = value,
    "--public-path=": value => config.publicPath = value,
    "--root=": value => config.root = value,
    "--silent": () => config.silent = true,
    "--coverage": () => config.coverage = true,
    "--headless": () => config.headless = true
};

process.argv.forEach(arg => {
    Object.keys(scripts).forEach(availableScript => {
        if(availableScript === arg)
            script = availableScript;
    });

    Object.keys(args).forEach(anchor => {
        if(arg.startsWith(anchor))
            args[anchor](arg.slice(anchor.length));
    });
});

require(scripts[script]).default(defaultConfig(config));
