import esbuild from "esbuild";
import glob from "glob";
import path, { resolve } from "path"
import fs from "fs";
import {fileURLToPath} from "url";

global.__dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildFile(file){
    return esbuild.build({
        entryPoints: [file],
        outfile: file.slice(0, -2) + "js",
        format: "esm",
        sourcemap: true
    });
}

const commands = glob.sync(resolve(__dirname, "commands", "**", "*.ts")).filter(file => !file.endsWith(".d.ts"));
const types = glob.sync(resolve(__dirname, "types", "**", "*.ts"));
const server = glob.sync(resolve(__dirname, "server", "**", "*.ts"));
const webapp = glob.sync(resolve(__dirname, "webapp", "**", "*.ts"));
const utils = glob.sync(resolve(__dirname, "utils", "**", "*.ts"));

const buildPromises: Promise<any>[] = [
    ...commands,
    ...types,
    ...server,
    ...webapp,
    ...utils,
    resolve(__dirname, "cli.ts"),
].map(file => buildFile(file));

await Promise.all(buildPromises);
console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");

const version = JSON.parse(fs.readFileSync(resolve(__dirname, "package.json"), {encoding: "utf8"})).version;

fs.writeFileSync(resolve(__dirname, "version.ts"), `const FullStackedVersion = "${version}";
export default FullStackedVersion;`);

await buildFile(resolve(__dirname, "./version.ts"));
