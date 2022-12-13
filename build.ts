import esbuild from "esbuild";
import glob from "glob";
import path from "path"
import fs from "fs";

async function buildFile(file){
    return esbuild.build({
        entryPoints: [file],
        outfile: file.slice(0, -2) + "js",
        format: "cjs",
        sourcemap: true
    });
}

(async function() {
    const scripts = glob.sync(path.resolve(__dirname, "./scripts") + "/**/*.ts")
        .filter(file => !file.endsWith(".d.ts"));

    const types = glob.sync(path.resolve(__dirname, "./types") + "/**/*.ts");

    const otherScripts = [
        path.resolve(__dirname, "cli.ts"),
        path.resolve(__dirname, ".mocharc.ts"),
        path.resolve(__dirname, "mocha-reporter.ts"),
        path.resolve(__dirname, "getPackageJSON.ts"),
        path.resolve(__dirname, "server", "index.ts"),
        path.resolve(__dirname, "webapp", "fetch.ts"),
        path.resolve(__dirname, "DockerInstallScripts.ts"),
        path.resolve(__dirname, "CommandInterface.ts"),
    ];

    const buildPromises: Promise<any>[] = scripts.concat(types).concat(otherScripts).map(file => {
        return buildFile(file);
    });

    await Promise.all(buildPromises);
    console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");

    fs.writeFileSync(path.resolve(__dirname, "version.ts"), `const version = "${require("./getPackageJSON").default().version}";
export default version;`);

    await buildFile(path.resolve(__dirname, "./version.ts"));
})()
