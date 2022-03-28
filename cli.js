#!/usr/bin/env node
const scripts = {
    "create": require("./scripts/create"),
    "build" : require("./scripts/build"),
    "watch" : require("./scripts/watch")
};
let script = "build"

let config = {}
const args = {
    "--src=": value => config.src = value,
    "--out=": value => config.out = value,
    "--silent": () => config.silent = true
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

scripts[script](require("./scripts/config")(config));
