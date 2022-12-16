import {it, Suite} from "mocha";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import Build from "../../scripts/build.js";
import Config from "../../scripts/config.js";
import Runner from "../../scripts/runner.js";
import getPackageJSON from "../../getPackageJSON.js";
import {build} from "esbuild";
import * as process from "process";

export default function(testSuite: Suite, srcDir: string = null){
    if(process.argv.includes("--test-mode"))
        return;

    if(!global.integrationTests)
        global.integrationTests = {passes: 0, failures: 0};

    testSuite.tests = [];

    it(`Integration [${testSuite.title}]`, async function(){
        this.timeout(10000000)
        await runIntegrationTest(testSuite, srcDir);
    });
}

async function runIntegrationTest(testSuite: Suite, srcDir: string){
    const testDir = path.resolve(path.dirname(testSuite.file), ".test");

    if(fs.existsSync(testDir))
        fs.rmSync(testDir, {force: true, recursive: true});

    fs.mkdirSync(testDir);

    const localConfig = await Config({
        name: "test",
        src: srcDir ?? process.cwd(),
        out: testDir,
        silent: true
    });
    await Build(localConfig);

    const dockerComposeFilePath = path.resolve(testDir, "dist", "docker-compose.yml");
    let dockerCompose: any = yaml.load(fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"}));

    dockerCompose.services.node.volumes = [
        process.cwd() + ":/app"
    ];

    const testFilePathComponents = testSuite.file.split(path.sep);
    const rootDirComponents = process.cwd().split(path.sep);
    const testFilePath = ["/app"];
    for (let i = 0; i < testFilePathComponents.length; i++) {
        if(testFilePathComponents[i] === rootDirComponents[i])
            continue;

        testFilePath.push(testFilePathComponents[i]);
    }

    const isFullStackedProject = getPackageJSON().name === "fullstacked";

    dockerCompose.services.node.command = [
        (isFullStackedProject ? "node" : "npx"),
        (isFullStackedProject ? "cli" : "fullstacked"),
        "test",
        "--test-file=" + testFilePath.join("/"),
        "--test-suite=" + testSuite.title,
        (process.argv.includes("--cover") ? "--coverage" : ""),
        "--test-mode"
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

    fs.rmSync(testDir, {force: true, recursive: true});
}
