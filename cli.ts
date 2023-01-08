#!/usr/bin/env node
import defaultConfig from "./utils/config";
import {FullStackedConfig} from "./index";

const scripts = {
    "build"     : "./commands/build.js",
    "run"       : "./commands/run.js",
    "watch"     : "./commands/watch.js",
    "test"      : "./commands/test.js",
    "deploy"    : "./commands/deploy.js",
    "backup"    : "./commands/backup.js",
    "restore"   : "./commands/restore.js"
};
let script = "run"

let config: FullStackedConfig = {}
const args = {
    "--src=": value => config.src = value,
    "--out=": value => config.out = value,
    "--host=": value => config.host = value,
    "--ssh-port=": value => config.sshPort = parseInt(value),
    "--username=": value => config.username = value,
    "--user=": value => config.username = value,
    "--password=": value => config.password = value,
    "--pass=": value => config.password = value,
    "--private-key=": value => config.privateKey = value,
    "--private-key-file=": value => config.privateKeyFile = value,
    "--app-dir=": value => config.appDir = value,
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
    "--no-https": () => config.noHttps = true,
    "--pull": () => config.pull = true,
    "--volume=": value => config.volume = upgradeToArray(value),
    "--backup-dir=": value => config.backupDir = value,
    "--timeout=": value => config.timeout = parseInt(value),
    "--watch-file=": value => config.watchFile = upgradeToArray(value),
    "--watch-dir=": value => config.watchDir = upgradeToArray(value),
    "--restored": () => config.restored = true,
    "--production": () => config.production = true,
    "--gui": () => config.gui = true,
    "--c8-out-dir=": value => config.c8OutDir = value,
    "--report-dir=": value => config.reportDir = value,
    "--ignore=": value => config.ignore = upgradeToArray(value),
    "--root=": value => config.root = value,
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

defaultConfig(config).then(async configReady => {
    const scriptModule = await import(scripts[script]);

    const CommandClass = scriptModule.default;
    let command;
    if(script === "deploy" || script === "watch" || script === "run")
        command = new CommandClass(configReady);
    else
        CommandClass(configReady);

    if(config.gui) {
        const guiModule = await import("./utils/gui");
        await guiModule.default(command);
    }else if(command?.runCLI)
        command.runCLI();
});


