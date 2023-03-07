import {buildSync} from "esbuild";
import {globSync} from "glob";
import fs from "fs";

buildSync({
    entryPoints: ["./utils/buildRecursively.ts"],
    outfile: "./utils/buildRecursively.js",
    platform: "node",
    format: "esm",
    sourcemap: true
});

const buildRecursively = await import("./utils/buildRecursively.js");

const commands  = globSync("./commands/**/*.ts", {ignore: ["**/node_modules/**"]});
const server    = globSync("./server/**/*.ts");
const client    = globSync("./client/**/*.ts");
const utils     = globSync("./utils/**/*.ts");

const toBuild = [
    ...commands,
    ...server,
    ...utils,
    ...client,
    "./create/cli.ts",
    "./create/create.ts",
    "./cli.ts"
].filter(file => !file.endsWith(".d.ts"));

await buildRecursively.default(toBuild);

const getAvailablePortScript = "./commands/deploy/nginx/getAvailablePorts.ts";
buildSync({
    entryPoints: [getAvailablePortScript],
    outfile: buildRecursively.convertPathToJSExt(getAvailablePortScript),
    bundle: true,
    sourcemap: true,
    format: "esm",
    platform: "node"
})

console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");

function updatePackageJsonVersion(location: string, version: string){
    const packageJsonFilePath = `${location}/package.json`;
    if(!fs.existsSync(packageJsonFilePath))
        throw Error(`Can not find package.json at [${packageJsonFilePath}]`);

    const packageJsonData = JSON.parse(fs.readFileSync(packageJsonFilePath).toString())
    packageJsonData.version = version;
    fs.writeFileSync(packageJsonFilePath, JSON.stringify(packageJsonData, null, 2));
}

const version = JSON.parse(fs.readFileSync("./package.json", {encoding: "utf8"})).version;

updatePackageJsonVersion("./commands/backup", version);
updatePackageJsonVersion("./commands/build", version);
updatePackageJsonVersion("./commands/deploy", version);
updatePackageJsonVersion("./commands/run", version);
updatePackageJsonVersion("./commands/watch", version);
updatePackageJsonVersion("./create", version);
updatePackageJsonVersion("./gui", version);

fs.writeFileSync("./version.ts", `const FullStackedVersion = "${version}";
export default FullStackedVersion;`);
await buildRecursively.default(["./version.ts"], true);

console.log(`v${version}`);
