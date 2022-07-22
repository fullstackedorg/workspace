import path from "path";
import {execSync} from "child_process";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config: Config){
    const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");

    // gather all test.ts files
    // TODO: swap to **/*test.ts maybe
    let testFiles = path.resolve(config.src, "**/integration/**", "test.ts");

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
    if(config.coverage)
        testCommand = "npx nyc --reporter text-summary --reporter html " + testCommand;

    execSync(testCommand, {stdio: "inherit"});
}
