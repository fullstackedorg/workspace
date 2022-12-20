import {Suite} from "mocha";
import path, {dirname, resolve} from "path";
import fs from "fs";
import {build} from "esbuild";
import {fileURLToPath} from "url";
import {getBuiltDockerCompose} from "./utils.js";
import yaml from "js-yaml";
import Docker from "./docker.js";
import DockerCompose from "dockerode-compose";
import glob from "glob";

export default async function(testSuite: Suite){
    const testTitle = testSuite.title
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[^a-zA-Z0-9_.-]/g, "");

    let srcDir = process.cwd();
    process.argv.forEach(arg => {
        if(!arg.startsWith("--src=")) return;
        srcDir = resolve(process.cwd(), arg.slice("--src=".length));
    });

    const tempTestDir = resolve(dirname(testSuite.file), ".test");

    if(fs.existsSync(tempTestDir)) fs.rmSync(tempTestDir, {force: true, recursive: true});
    fs.mkdirSync(tempTestDir);

    await build({
        entryPoints: [testSuite.file],
        outfile: resolve(tempTestDir, "test.mjs"),
        platform: 'node',
        bundle: true,
        format: "esm",
        sourcemap: true,

        // source: https://github.com/evanw/esbuild/issues/1921#issuecomment-1166291751
        banner: {js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);"},

        external: [
            fileURLToPath(import.meta.url),
            'mocha'
        ]
    })

    const dockerComposeData: any = getBuiltDockerCompose(srcDir);

    dockerComposeData.services.node.volumes = [tempTestDir + ":/app"];

    const cmd = process.argv.includes("--cover")
        ? ["npm", "i", "mocha", "c8", "--silent", "&&",
            "npx", "c8", "--reporter none", `--temp-directory /app/.c8`, "npx", "mocha", "test.mjs", "--testing"]
        : ["npm", "i", "mocha", "--silent", "&&",
            "npx", "mocha", "test.mjs", "--testing"]

    dockerComposeData.services.node.command = [
        "/bin/sh",
        "-c",
        cmd.join(" "),
    ];

    Object.keys(dockerComposeData.services).forEach(serviceName => {
        delete dockerComposeData.services[serviceName].restart;
        delete dockerComposeData.services[serviceName].expose;
        delete dockerComposeData.services[serviceName].ports;
    });

    const dockerComposeStr = yaml.dump(dockerComposeData, {forceQuotes: true})
        // fix windows absolute path
        .replace(/\\/g, "/").replace(/C:/, "/c");

    fs.writeFileSync(resolve(tempTestDir, "docker-compose.yml"), dockerComposeStr);

    const docker = await Docker();
    const dockerCompose = new DockerCompose(docker, resolve(tempTestDir, "docker-compose.yml"), testTitle)

    await dockerCompose.up();

    let results = ""
    await new Promise(async resolve => {
        const logsStream = (await (await docker.getContainer(testTitle + '_node_1')).logs({stdout: true, stderr: true, follow: true}));
        logsStream.on("data", chunk => {
            if(!chunk.toString().match(/(\d+ (passing|failing)|npm notice)/g))
                process.stdout.write(chunk);
            results += chunk.toString();
        });
        logsStream.on("end", resolve);
    });

    await dockerCompose.down({v: true});

    const passingMatches = Array.from(results.matchAll(/\d+ passing/g));
    const failingMatches = Array.from(results.matchAll(/\d+ failing/g));

    const passing = parseInt(passingMatches[0][0]);
    const failing = failingMatches.length ? parseInt(failingMatches[0][0]) : 0;

    global.integrationTests.passes += passing;
    global.integrationTests.failures += failing;

    const c8OutDir = resolve(tempTestDir, ".c8");
    glob.sync(resolve(c8OutDir, "*.json")).forEach(filePath => {
        const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
        const updatedContent = content.replace(/\/app\/.*?\./g, value => {
            const pathComponents = value.split("/");
            pathComponents.shift(); // remove ""
            pathComponents.shift(); // remove "app"
            return resolve(tempTestDir,  pathComponents.join(path.sep))
                // windows paths
                .replace(/\\/g, "/").replace(/C:/g, "/C:");
        });
        const fileName = filePath.slice(c8OutDir.length + 1);
        fs.writeFileSync(resolve(srcDir, ".c8", fileName), updatedContent);
    });
}
