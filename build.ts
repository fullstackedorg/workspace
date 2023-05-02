import {buildSync, Platform} from "esbuild";
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
    "./packages/ide/index.ts",
    "./packages/ide/install.ts",
    "./packages/watch/index.ts",
    "./packages/watch/fileParser.ts",
    "./packages/watch/watcher.ts",
    "./packages/watch/fileParser.ts",
    "./packages/watch/builder.ts",
    "./packages/watch/utils.ts",
    "./packages/create/index.ts",
    "./packages/create/cli.ts",
    "./packages/create/create.ts",
    "./packages/webapp/server/index.ts",
    "./packages/webapp/server/HTML.ts",
    "./packages/webapp/client/react/useAPI.ts",
    "./packages/webapp/rpc/createClient.ts",
    "./packages/webapp/rpc/createListener.ts",
    "./CommandInterface.ts",
    "./info.ts",
    "./pack.ts",
    "./prepare.ts",
    "./test.ts",
    "./cli.ts"
].filter(file => !file.endsWith(".d.ts"));

await buildRecursively.default(toBuild);

[
    {
        file: "./packages/deploy/nginx/getAvailablePorts.ts",
        platform: "node"
    },
    {
        file: "./packages/watch/client.ts",
        platform: "browser"
    }
].forEach(toBundle => buildSync({
    entryPoints: [toBundle.file],
    outfile: buildRecursively.convertPathToJSExt(toBundle.file),
    bundle: true,
    sourcemap: true,
    format: "esm",
    platform: toBundle.platform as Platform
}));

console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");

const version = JSON.parse(fs.readFileSync("./package.json", {encoding: "utf8"})).version;

fs.writeFileSync("./version.ts", `const FullStackedVersion = "${version}";
export default FullStackedVersion;`);
await buildRecursively.default(["./version.ts"], true);

console.log(`v${version}`);


