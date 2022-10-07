#!/usr/bin/env node
import defaultConfig from "./scripts/config";

const scripts = {
    "build" : "./scripts/build",
    "run"   : "./scripts/run",
    "watch" : "./scripts/watch",
    "deploy": "./scripts/deploy",
    "test"  : "./scripts/test",
    "backup": "./scripts/backup",
    "restore": "./scripts/restore"
};
let script = "run"

let config: Config = {}
const args = {
    "--src=": value => config.src = value,
    "--out=": value => config.out = value,
    "--host=": value => config.host = value,
    "--ssh-port=": value => config.sshPort = parseInt(value),
    "--user=": value => config.user = value,
    "--pass=": value => config.pass = value,
    "--private-key=": value => config.privateKey = value,
    "--app-dir=": value => config.appDir = value,
    "--silent": () => config.silent = true,
    "--coverage": () => config.coverage = true,
    "--headless": () => config.headless = true,
    "--test-mode": () => config.testMode = true,
    "--test-file=": value => config.testFile = value,
    "--test-suite=": value => config.testSuite = value,
    "--skip-test": () => config.skipTest = true,
    "--y": () => config.allYes = true,
    "--version=": value => config.version = value,
    "--hash=": value => config.hash = value,
    "--name=": value => config.name = value,
    "--title=": value => config.title = value,
    "--no-nginx": () => config.noNginx = true,
    "--pull": () => config.pull = true,
    "--volume=": value => config.volume = upgradeToArray(value),
    "--backup-dir=": value => config.backupDir = value,
    "--timeout=": value => config.timeout = parseInt(value),
    "--watch-file=": value => config.watchFile = upgradeToArray(value),
    "--watch-dir=": value => config.watchDir = upgradeToArray(value),
    "--restored": () => config.restored = true
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

require(scripts[script]).default(defaultConfig(config));
