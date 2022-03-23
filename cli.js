#!/usr/bin/env node
const scripts = {
    "build": require("./Scripts/build"),
    "watch": require("./Scripts/watch")
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

scripts[script](require("./Scripts/config")(config));
