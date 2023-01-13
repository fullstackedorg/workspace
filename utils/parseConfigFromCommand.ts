import {FullStackedConfig} from "../index";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const scriptsDir = resolve(__dirname, "..", "commands");
const scripts = [
    "build",
    "run",
    "watch",
    "test",
    "deploy",
    "backup",
    "restore"
];

const args = {
    "--src=": value => ({src: value}),
    "--out=": value => ({out: value}),
    "--host=": value => ({host: value}),
    "--ssh-port=": value => ({sshPort: parseInt(value)}),
    "--username=": value => ({username: value}),
    "--user=": value => ({username: value}),
    "--password=": value => ({password: value}),
    "--pass=": value => ({password: value}),
    "--private-key=": value => ({privateKey: value}),
    "--private-key-file=": value => ({privateKeyFile: value}),
    "--app-dir=": value => ({appDir: value}),
    "--silent": () => ({silent: true}),
    "--coverage": () => ({coverage: true}),
    "--headless": () => ({headless: true}),
    "--test-mode": () => ({testMode: true}),
    "--test-file=": value => ({testFile: value}),
    "--test-suite=": value => ({testSuite: value}),
    "--y": () => ({allYes: true}),
    "--version=": value => ({version: value}),
    "--hash=": value => ({hash: value}),
    "--name=": value => ({name: value}),
    "--title=": value => ({title: value}),
    "--no-https": () => ({noHttps: true}),
    "--pull": () => ({pull: true}),
    "--volume=": value => ({volume: upgradeToArray(value)}),
    "--backup-dir=": value => ({backupDir: value}),
    "--timeout=": value => ({timeout: parseInt(value)}),
    "--watch-file=": value => ({watchFile: upgradeToArray(value)}),
    "--watch-dir=": value => ({watchDir: upgradeToArray(value)}),
    "--restored": () => ({restored: true}),
    "--production": () => ({production: true}),
    "--gui": () => ({gui: true}),
    "--c8-out-dir=": value => ({c8OutDir: value}),
    "--report-dir=": value => ({reportDir: value}),
    "--ignore=": value => ({ignore: upgradeToArray(value)}),
    "--root=": value => ({root: value}),
};

function upgradeToArray(rawValue: string): string | string[]{
    return rawValue.includes(",")
        ? rawValue.split(",").map(value => value.trim())
        : rawValue;
}

export default function parseConfigFromCommand(): {script: string, config: FullStackedConfig} {
    let script = "run"
    let config: FullStackedConfig = {};

    process.argv.forEach(arg => {
        if(scripts.includes(arg))
            script = arg;

        Object.keys(args).forEach(anchor => {
            if(arg.startsWith(anchor)) {
                config = {
                    ...config,
                    ...args[anchor](arg.slice(anchor.length))
                }
            }
        });
    });

    script = resolve(scriptsDir, script + ".js");

    return {script, config};
}
