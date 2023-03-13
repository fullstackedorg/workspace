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

const utils = globSync("./utils/**/*.ts");

const toBuild = [
    ...utils,
    "./packages/backup/index.ts",
    "./packages/gui/index.ts",
    "./packages/build/index.ts",
    "./packages/deploy/index.ts",
    "./packages/run/index.ts",
    "./packages/watch/index.ts",
    "./packages/watch/clientWatcher.ts",
    "./packages/create/index.ts",
    "./packages/create/cli.ts",
    "./packages/create/create.ts",
    "./packages/create/install.ts",
    "./packages/webapp/server/index.ts",
    "./packages/webapp/server/HTML.ts",
    "./packages/webapp/server/start.ts",
    "./CommandInterface.ts",
    "./info.ts",
    "./cli.ts"
].filter(file => !file.endsWith(".d.ts"));

await buildRecursively.default(toBuild);

const getAvailablePortScript = "./packages/deploy/nginx/getAvailablePorts.ts";
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

updatePackageJsonVersion("./packages/backup", version);
updatePackageJsonVersion("./packages/build", version);
updatePackageJsonVersion("./packages/deploy", version);
updatePackageJsonVersion("./packages/run", version);
updatePackageJsonVersion("./packages/watch", version);
updatePackageJsonVersion("./packages/webapp", version);
updatePackageJsonVersion("./packages/create", version);
updatePackageJsonVersion("./packages/gui", version);

fs.writeFileSync("./version.ts", `const FullStackedVersion = "${version}";
export default FullStackedVersion;`);
await buildRecursively.default(["./version.ts"], true);

console.log(`v${version}`);


