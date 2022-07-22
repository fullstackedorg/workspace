import {Suite} from "mocha";
import yaml from "yaml";
import fs from "fs";
import path from "path";
import {getPackageJSON, silenceCommandLine} from "../../scripts/utils";
import {execSync} from "child_process";

export default function(testSuite: Suite, srcDir: string = null){
    if(process.argv.includes("--test-mode"))
        return;

    testSuite.tests = [];

    const testFilePathComponents = testSuite.file.split("/");
    testFilePathComponents.pop();
    const testDir = path.resolve(testFilePathComponents.join("/"), ".test");

    if(fs.existsSync(testDir))
        fs.rmSync(testDir, {force: true, recursive: true});

    fs.mkdirSync(testDir);

    let dockerCompose = yaml.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "docker-compose.yml"), {encoding: "utf-8"}));

    dockerCompose.services.node.volumes = [
        process.cwd() + ":/app"
    ];

    const isFullStackedProject = getPackageJSON().name === "fullstacked";

    dockerCompose.services.node.command = [
        (isFullStackedProject ? "node" : "npx"),
        (isFullStackedProject ? "cli" : "fullstacked"),
        "test",
        "--test-file=" + testSuite.file.replace(process.cwd(), "/app"),
        "--test-suite=" + testSuite.title,
        (process.argv.includes("--coverage") ? "--coverage" : ""),
        "--test-mode"
    ];

    if(srcDir && !isFullStackedProject){
        const srcDockerComposeFilePath = path.resolve(srcDir, "docker-compose.yml");
        if(fs.existsSync(srcDockerComposeFilePath)){
            const srcDockerCompose = yaml.parse(fs.readFileSync(srcDockerComposeFilePath, {encoding: "utf-8"}));
            dockerCompose = {
                ...dockerCompose,
                ...srcDockerCompose,
                services: {
                    ...dockerCompose.services,
                    ...(srcDockerCompose.services ?? {})
                }
            };
        }
    }


    Object.keys(dockerCompose.services).forEach(service => {
        if(dockerCompose.services[service].ports)
            delete dockerCompose.services[service].ports;
    });

    const dockerComposeFilePath = path.resolve(testDir, "docker-compose.yml")
    fs.writeFileSync(dockerComposeFilePath, yaml.stringify(dockerCompose));

    execSync(silenceCommandLine(`docker-compose -f ${dockerComposeFilePath} up -d`));
    const results = execSync(`docker-compose -f ${dockerComposeFilePath} logs --no-log-prefix -f node`).toString();
    execSync(silenceCommandLine(`docker-compose -f ${dockerComposeFilePath} down -t 0 -v`));

    const passingMatches = Array.from(results.matchAll(/\d+ passing/g));
    const failingMatches = Array.from(results.matchAll(/\d+ failing/g));

    const passing = parseInt(passingMatches[0][0]);
    const failing = failingMatches.length ? parseInt(failingMatches[0][0]) : 0;

    if(!global.integrationTests)
        global.integrationTests = {passes: 0, failures: 0};

    global.integrationTests.passes += passing;
    global.integrationTests.failures += failing;

    const beginning = Array.from(results.matchAll(new RegExp(".*" + testSuite.title, "g")));
    const sliced = results.slice(beginning[0].index, failing === 0 ? passingMatches[0].index : undefined);

    const endLineMatches = Array.from(sliced.matchAll(/\w\r?\n/g));
    const lastLine = endLineMatches.length ? endLineMatches.pop() : null;

    console.log(sliced.slice(0, lastLine ? lastLine.index + lastLine[0].length : undefined).trim() + "\n");

    fs.rmSync(testDir, {force: true, recursive: true});
}
