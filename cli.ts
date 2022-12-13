#!/usr/bin/env node
import defaultConfig from "./scripts/config";
import {CommandInterface} from "./CommandInterface";

const scripts = {
    "build"     : "./scripts/build",
    "run"       : "./scripts/run",
    "watch"     : "./scripts/watch",
    "test"      : "./scripts/test",
    "deploy"    : "./scripts/deploy",
    "backup"    : "./scripts/backup",
    "restore"   : "./scripts/restore"
};
let script = "run"

let config: Config = {}
const args = {
    "--src=": value => config.src = value,
    "--out=": value => config.out = value,
    "--pass=": value => config.pass = value,
    "--silent": () => config.silent = true,
    "--coverage": () => config.coverage = true,
    "--headless": () => config.headless = true,
    "--test-mode": () => config.testMode = true,
    "--test-file=": value => config.testFile = value,
    "--test-suite=": value => config.testSuite = value,
    "--y": () => config.allYes = true,
    "--version=": value => config.version = value,
    "--hash=": value => config.hash = value,
    "--name=": value => config.name = value,
    "--title=": value => config.title = value,
    "--pull": () => config.pull = true,
    "--volume=": value => config.volume = upgradeToArray(value),
    "--backup-dir=": value => config.backupDir = value,
    "--watch-file=": value => config.watchFile = upgradeToArray(value),
    "--watch-dir=": value => config.watchDir = upgradeToArray(value),
    "--restored": () => config.restored = true,
    "--production": () => config.production = true,
    "--gui": () => config.gui = true,
};

function upgradeToArray(rawValue: string): string | string[]{
    return rawValue.includes(",")
        ? rawValue.split(",").map(value => value.trim())
        : rawValue;
}

process.argv.forEach(arg => {
    Object.keys(scripts).forEach(availableScript => {
        if(availableScript === arg)
            script = availableScript;
    });

    Object.keys(args).forEach(anchor => {
        if(arg.startsWith(anchor)) {
            args[anchor](arg.slice(anchor.length));
        }
    });
});

const CommandClass = require(scripts[script]).default;
let command;
if(script === "deploy")
    command = new CommandClass(defaultConfig(config));
else
    CommandClass(defaultConfig(config));
    


if(config.gui)
    require("./scripts/gui").default(command);
else if(command?.runCLI)
    command.runCLI();
