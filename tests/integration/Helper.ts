import {it, Suite} from "mocha";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import {execSync} from "child_process";
import build from "../../scripts/build";
import config from "../../scripts/config";
import Runner from "../../scripts/runner";
import getPackageJSON from "../../getPackageJSON";

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

    const localConfig = await config({
        name: "test",
        src: srcDir ?? process.cwd(),
        out: testDir,
        silent: true
    });
    await build(localConfig);

    const dockerComposeFilePath = path.resolve(testDir, "dist", "docker-compose.yml");
    let dockerCompose = yaml.parse(fs.readFileSync(dockerComposeFilePath, {encoding: "utf-8"}));

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
        (process.argv.includes("--coverage") ? "--coverage" : ""),
        "--test-mode"
    ];

    delete dockerCompose.services.node.restart;

    fs.writeFileSync(dockerComposeFilePath, yaml.stringify(dockerCompose));

    const runner = new Runner(localConfig);
    await runner.start();
    const results = execSync(`docker-compose -p ${localConfig.name} -f ${dockerComposeFilePath} logs --no-log-prefix -f node`).toString();
    await runner.stop();

    const passingMatches = Array.from(results.matchAll(/\d+ passing/g));
    const failingMatches = Array.from(results.matchAll(/\d+ failing/g));

    const passing = parseInt(passingMatches[0][0]);
    const failing = failingMatches.length ? parseInt(failingMatches[0][0]) : 0;

    global.integrationTests.passes += passing;
    global.integrationTests.failures += failing;

    const beginning = Array.from(results.matchAll(new RegExp(".*" + testSuite.title, "g")));
    const sliced = results.slice(beginning[0].index, failing === 0 ? passingMatches[0].index : undefined);

    const endLineMatches = Array.from(sliced.matchAll(/\w\r?\n/g));
    const lastLine = endLineMatches.length ? endLineMatches.pop() : null;

    console.log(sliced.slice(0, lastLine ? lastLine.index + lastLine[0].length : undefined).trim() + "\n");

    fs.rmSync(testDir, {force: true, recursive: true});
}
