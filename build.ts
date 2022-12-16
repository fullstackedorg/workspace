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

(async function() {
    const scripts = glob.sync(resolve(__dirname, "scripts", "**", "*.ts")).filter(file => !file.endsWith(".d.ts"));

    const types = glob.sync(resolve(__dirname, "types", "**", "*.ts"));

    const otherScripts = [
        resolve(__dirname, "cli.ts"),
        resolve(__dirname, "getPackageJSON.ts"),
        resolve(__dirname, "server", "index.ts"),
        resolve(__dirname, "DockerInstallScripts.ts"),
        resolve(__dirname, "CommandInterface.ts"),
        resolve(__dirname, "testsDockerImages.ts")
    ];

    const buildPromises: Promise<any>[] = [...scripts, ...types, ...otherScripts].map(file => buildFile(file));

    await Promise.all(buildPromises);
    console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");

    const version = JSON.parse(fs.readFileSync(resolve(__dirname, "package.json"), {encoding: "utf8"})).version;

    fs.writeFileSync(resolve(__dirname, "version.ts"), `const version = "${version}";
export default version;`);

    await buildFile(resolve(__dirname, "./version.ts"));
})()
