import {Suite} from "mocha";
import path, {dirname, resolve} from "path";
import fs from "fs";
import {build} from "esbuild";
import {fileURLToPath} from "url";
import {getBuiltDockerCompose, getExternalModules} from "./utils";
import yaml from "js-yaml";
import Docker from "./docker";
import DockerCompose from "dockerode-compose";
import glob from "glob";
import {Writable} from "stream";
import randStr from "./randStr";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function(testSuite: Suite, options?: {
    src?: string,
    out?: string
}){
    const testTitle = testSuite.title
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[^a-zA-Z0-9_.-]/g, "");

    let srcDir = process.cwd();
    process.argv.forEach(arg => {
        if(!arg.startsWith("--src=")) return;
        srcDir = resolve(process.cwd(), arg.slice("--src=".length));
    });
    if(options?.src) srcDir = options.src;

    const outDir = options?.out ?? srcDir;

    const tempTestDir = resolve(dirname(testSuite.file), `.test-${randStr(5)}`);

    if(fs.existsSync(tempTestDir)) fs.rmSync(tempTestDir, {force: true, recursive: true});
    fs.mkdirSync(tempTestDir);

    await build({
        entryPoints: [testSuite.file],
        outfile: resolve(tempTestDir, "test.mjs"),
        platform: 'node',
        bundle: true,
        format: "esm",
        sourcemap: true,

        plugins: [{
            name: "ignore-self",
            setup(currentBuild){
                currentBuild.onResolve({filter: /.*testIntegrationRunner\.js$/g}, args => ({external: true}));
            }
        }],

        // source: https://github.com/evanw/esbuild/issues/1921#issuecomment-1166291751
        banner: {js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);"},

        external: [
            'mocha',
            ...getExternalModules(srcDir)
        ]
    });

    const dockerComposeData: any = getBuiltDockerCompose(srcDir);

    dockerComposeData.services.node.volumes = [tempTestDir + ":/app"];

    const installCommand = process.argv.includes("--cover")
        ? ["npm", "i", "mocha", "c8", "--silent"]
        : ["npm", "i", "mocha", "--silent"]

    const baseTestCommand = ["mocha", "test.mjs", "--testing", "--color"];

    const testCommand = process.argv.includes("--cover")
        ? ["npx", "c8", "--reporter none", `--temp-directory /app/.c8`, ...baseTestCommand]
        : ["npx", ...baseTestCommand];

    const nativeFilePath = resolve(srcDir, "server", "native.json")
    if(fs.existsSync(nativeFilePath)){
        fs.cpSync(nativeFilePath, resolve(tempTestDir, "native.json"));
        fs.cpSync(resolve(__dirname, "..", "server", "installNative.js"), resolve(tempTestDir, "installNative.mjs"));
        installCommand.push(...["&&", "node", "installNative.mjs"])
    }

    dockerComposeData.services.node.command = [
        "/bin/sh",
        "-c",
        installCommand.join(" ") + " && " + testCommand.join(" "),
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
    await new Promise<void>(async resolve => {
        const container = await docker.getContainer(testTitle + '_node_1');
        const logsStream = await container.logs({stdout: true, stderr: true, follow: true});

        const stream = new Writable({
            write: function(chunk, encoding, next) {
                const str = chunk.toString();

                if(str.trim() && !chunk.toString().match(/(\d+ (passing|failing)|npm notice)/g))
                    process.stdout.write(chunk);

                results += chunk.toString();
                next();
            }
        });

        container.modem.demuxStream(logsStream, stream, stream);

        logsStream.on("end", () => {
            global.integrationTests.count--;
            if(global.integrationTests.count === 0)
                process.stdout.write("\n\r");

            resolve()
        });
    });

    await dockerCompose.down({ volumes: true });

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

        const finalC8OutDir = resolve(outDir, ".c8")
        if(!fs.existsSync(finalC8OutDir)) fs.mkdirSync(finalC8OutDir, {recursive: true});
        fs.writeFileSync(resolve(finalC8OutDir, fileName), updatedContent);
    });
}
