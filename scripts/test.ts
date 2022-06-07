import path from "path";
import {execSync} from "child_process";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config: Config){
    const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");

    // gather all test.ts files
    // TODO: swap to **/*.test.ts maybe
    const testFiles = path.resolve(process.cwd(), "**/test.ts");

    let testCommand = `npx mocha "${testFiles}" --config ` + mochaConfigFile + " " +
        (config.headless ? "--headless" : "") + " " +
        (config.coverage ? "--coverage" : "");

    // use nyc for coverage
    if(config.coverage) {
        let nycCommand = "npx nyc --reporter text-summary --reporter html";
        if(config.reportDir)
            nycCommand += " --report-dir " + config.reportDir;

        testCommand = nycCommand + " " + testCommand;
    }

    execSync(testCommand, {stdio: "inherit"});
}
