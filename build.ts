import {buildSync} from "esbuild";
import {globSync} from "glob";
import {dirname, resolve} from "path"
import fs from "fs";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

buildSync({
    entryPoints: [resolve(__dirname, "utils", "buildRecursively.ts")],
    outfile: resolve(__dirname, "utils", "buildRecursively.js"),
    platform: "node",
    format: "esm",
    sourcemap: true
});

const builtModule = resolve(__dirname, "utils", "buildRecursively.js")
    // windows path...
    .replace(/C:/, "").replace(/\\/g, "/");

const buildRecursively = (await import(builtModule)).default;

const commands  = globSync(resolve(__dirname, "commands", "**", "*.ts"));
const types     = globSync(resolve(__dirname, "types", "**", "*.ts"));
const server    = globSync(resolve(__dirname, "server", "**", "*.ts"));
const webapp    = globSync(resolve(__dirname, "webapp", "**", "*.ts"));
const utils     = globSync(resolve(__dirname, "utils", "**", "*.ts"));

const toBuild = [
    ...commands,
    ...types,
    ...server,
    ...utils,
    ...webapp,
    resolve(__dirname, "create", "cli.ts"),
    resolve(__dirname, "create", "create.ts"),
    resolve(__dirname, "cli.ts"),
].filter(file => !file.endsWith(".d.ts"));

await buildRecursively(toBuild);

const nginxDir = resolve(__dirname, "commands", "deploy", "nginx");
buildSync({
    entryPoints: [resolve(nginxDir, "getAvailablePorts.ts")],
    outfile: resolve(nginxDir, "getAvailablePorts.js"),
    bundle: true,
    sourcemap: true,
    format: "esm",
    platform: "node"
})

console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");

function updatePackageJsonVersion(location: string, version: string){
    const packageJsonFilePath = resolve(__dirname, location, "package.json");
    if(!fs.existsSync(packageJsonFilePath))
        throw Error(`Can not find package.json at [${packageJsonFilePath}]`);

    const packageJsonData = JSON.parse(fs.readFileSync(packageJsonFilePath).toString())
    packageJsonData.version = version;
    fs.writeFileSync(packageJsonFilePath, JSON.stringify(packageJsonData, null, 2));
}

const version = JSON.parse(fs.readFileSync(resolve(__dirname, "package.json"), {encoding: "utf8"})).version;

updatePackageJsonVersion("commands/backup", version);
updatePackageJsonVersion("commands/build", version);
updatePackageJsonVersion("commands/deploy", version);
updatePackageJsonVersion("commands/run", version);
updatePackageJsonVersion("commands/watch", version);
updatePackageJsonVersion("create", version);
updatePackageJsonVersion("gui", version);

fs.writeFileSync(resolve(__dirname, "version.ts"), `const FullStackedVersion = "${version}";
export default FullStackedVersion;`);
await buildRecursively([resolve(__dirname, "./version.ts")], true);

console.log(`v${version}`);
