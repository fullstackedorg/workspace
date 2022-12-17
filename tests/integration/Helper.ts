import {it, Suite} from "mocha";
import yaml from "js-yaml";
import fs from "fs";
import path, {dirname, resolve} from "path";
import Build from "../../commands/build.js";
import Config from "../../utils/config.js";
import Runner from "../../utils/runner.js";
import getPackageJSON from "../../utils/getPackageJSON.js";
import glob from "glob";

export default function(testSuite: Suite, testDir: string = null){
    if(process.argv.includes("--test-mode"))
        return;

    if(!global.integrationTests)
        global.integrationTests = {passes: 0, failures: 0};

    testSuite.tests = [];

    it(`Integration [${testSuite.title}]`, async function(){
        this.timeout(10000000)
        await runIntegrationTest(testSuite, testDir);
    });
}

async function runIntegrationTest(testSuite: Suite, testDir: string){
    let srcDir = process.cwd();
    process.argv.forEach(arg => {
        if(!arg.startsWith("--src=")) return;
        srcDir = resolve(process.cwd(), arg.slice("--src=".length));
    });

    const tempTestDir = resolve(dirname(testSuite.file), ".test");

    if(fs.existsSync(tempTestDir))
        fs.rmSync(tempTestDir, {force: true, recursive: true});

    fs.mkdirSync(tempTestDir);

    const localConfig = await Config({
        name: "test",
        src: testDir ?? process.cwd(),
        out: tempTestDir,
        silent: true
    });
    await Build(localConfig);

    const dockerComposeFilePath = path.resolve(tempTestDir, "dist", "docker-compose.yml");
    let dockerCompose: any = yaml.load(fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"}));

    dockerCompose.services.node.volumes = [
        process.cwd() + ":/app"
    ];

    const testFilePathComponents = testSuite.file.split("/");
    const rootDirComponents = process.cwd().split(path.sep);
    const testFilePath = ["/app"];
    for (let i = 0; i < testFilePathComponents.length; i++) {
        if(testFilePathComponents[i] === rootDirComponents[i])
            continue;

        testFilePath.push(testFilePathComponents[i]);
    }

    const isFullStackedProject = getPackageJSON().name === "fullstacked";

    const c8OutDir = resolve(tempTestDir, ".c8");
    const c8OutDirInContainer = c8OutDir.replace(process.cwd(), "/app");

    dockerCompose.services.node.command = [
        (isFullStackedProject ? "node" : "npx"),
        (isFullStackedProject ? "cli" : "fullstacked"),
        "test",
        "--test-file=" + testFilePath.join("/"),
        "--test-suite=" + testSuite.title,
        "--test-mode",
        (process.argv.includes("--cover") ? "--coverage" : ""),
        (process.argv.includes("--cover") ? `--c8-out-dir=${c8OutDirInContainer}` : ""),
    ];

    delete dockerCompose.services.node.restart;

    const dockerComposeStr = yaml.dump(dockerCompose, {forceQuotes: true})
        // fix windows absolute path
        .replace(/\\/g, "/").replace(/C:/, "/c");

    fs.writeFileSync(dockerComposeFilePath, dockerComposeStr);

    const runner = new Runner(localConfig);
    await runner.start();
    let results = ""
    await new Promise(async resolve => {
        const logsStream = (await (await localConfig.docker.getContainer(localConfig.name + '_node_1')).logs({stdout: true, stderr: true, follow: true}));
        logsStream.on("data", chunk => {
            if(!chunk.toString().match(/\d+ (passing|failing)/g))
                process.stdout.write(chunk);
            results += chunk.toString();
        });
        logsStream.on("end", resolve);
    });
    await runner.stop();

    const passingMatches = Array.from(results.matchAll(/\d+ passing/g));
    const failingMatches = Array.from(results.matchAll(/\d+ failing/g));

    const passing = parseInt(passingMatches[0][0]);
    const failing = failingMatches.length ? parseInt(failingMatches[0][0]) : 0;

    global.integrationTests.passes += passing;
    global.integrationTests.failures += failing;

    glob.sync(resolve(c8OutDir, "*.json")).forEach(filePath => {
        const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
        const updatedContent = content.replace(/\/app\/.*?\./g, value => {
            const pathComponents = value.split("/");
            pathComponents.shift(); // remove ""
            pathComponents.shift(); // remove "app"
            return resolve(process.cwd(),  pathComponents.join(path.sep))
                // windows paths
                .replace(/\\/g, "/").replace(/C:/g, "/C:");
        });
        const fileName = filePath.slice(c8OutDir.length + 1);
        fs.writeFileSync(resolve(srcDir, ".c8", fileName), updatedContent);
    });

    fs.rmSync(tempTestDir, {recursive: true});
}
