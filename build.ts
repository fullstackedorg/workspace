import {buildSync} from "esbuild";
import glob from "glob";
import {dirname, resolve} from "path"
import fs from "fs";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

buildSync({
    entryPoints: [resolve(__dirname, "utils", "buildRecursively.ts")],
    outfile: resolve(__dirname, "utils", "buildRecursively.js"),
    platform: "node",
    format: "esm",
    sourcemap: true,
});

const buildRecursively = (await import(resolve(__dirname, "utils", "buildRecursively.js").replace(/C:/, "").replace(/\\/, "/"))).default;

const commands = glob.sync(resolve(__dirname, "commands", "**", "*.ts")).filter(file => !file.endsWith(".d.ts"));
const types = glob.sync(resolve(__dirname, "types", "**", "*.ts"));
const server = glob.sync(resolve(__dirname, "server", "**", "*.ts"));
const webapp = glob.sync(resolve(__dirname, "webapp", "**", "*.ts"));
const utils = glob.sync(resolve(__dirname, "utils", "**", "*.ts"));

const toBuild = [
    ...commands,
    ...types,
    ...server,
    ...utils,
    ...webapp,
    resolve(__dirname, "tests", "installToCreateFullStacked.ts"),
    resolve(__dirname, "tests", "testCreateFullStacked.ts"),
    resolve(__dirname, "tests", "testsDockerImages.ts"),
    resolve(__dirname, "server.ts"),
    resolve(__dirname, "cli.ts"),
];

await buildRecursively(toBuild);

console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");

const version = JSON.parse(fs.readFileSync(resolve(__dirname, "package.json"), {encoding: "utf8"})).version;
fs.writeFileSync(resolve(__dirname, "version.ts"), `const FullStackedVersion = "${version}";
export default FullStackedVersion;`);
await buildRecursively([resolve(__dirname, "./version.ts")], true);

console.log(`v${version}`);
