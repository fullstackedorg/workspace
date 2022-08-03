import path from "path";
import {execSync} from "child_process";
import glob from "glob";
import fs from "fs";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config: Config){
    const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");

    // gather all test.ts files
    // TODO: swap to **/*test.ts maybe
    let testFiles = path.resolve(config.src, "**", "test.ts");

    if(config.testFile)
        testFiles = config.testFile;

    let testCommand = "npx mocha \"" + testFiles + "\" " +
        "--config " + mochaConfigFile + " " +
        "--reporter " + path.resolve(__dirname, "..", "mocha-reporter.js") + " " +
        (config.testSuite ? "--grep \"" + config.testSuite + "\"" : "") + " " +
        (config.headless ? "--headless" : "") + " " +
        (config.coverage ? "--coverage" : "") + " " +
        (config.testMode ? "--test-mode" : "") + " ";

    // use nyc for coverage
    if(config.coverage) {
        testCommand = "npx nyc" + " " +
            "--silent" + " " +
            "--temp-dir " + path.resolve(config.src, ".nyc_output") + " " +
            (config.testMode ? "--no-clean" : "") + " " +
            testCommand;
    }

    execSync(testCommand, {stdio: "inherit"});

    if(config.coverage && !config.testMode){
        glob.sync(path.resolve(config.src, ".nyc_output", "*.json")).forEach(file => {
            const content = fs.readFileSync(file, {encoding: 'utf-8'});
            const updatedContent = content.replace(/\/app.*?\./g, value => {
                const pathComponents = value.split("/");
                pathComponents.shift(); // remove ""
                pathComponents.shift(); // remove "app"
                return path.resolve(config.src,  pathComponents.join(path.sep));
            });
            fs.writeFileSync(file, updatedContent);
        });

        execSync("npx nyc report" + " " +
            "--reporter html" + " " +
            "--reporter text-summary" + " " +
            "--report-dir " + path.resolve(config.src, "coverage") + " " +
            "--temp-dir " + path.resolve(config.src, ".nyc_output"), {stdio: "inherit"});
    }
}
