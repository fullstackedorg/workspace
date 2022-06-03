import path from "path";
import child_process, {execSync} from "child_process";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config){
    const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");

    // gather all test.ts files
    // TODO: swap to **/*.test.ts maybe
    const testFiles = path.resolve(process.cwd(), "**/test.ts");

    let testCommand = `npx mocha "${testFiles}" --config ` + mochaConfigFile + " " +
        (config.headless ? "--headless" : "") + " " +
        (config.coverage ? "--coverage" : "");

    // use nyc for coverage
    if(config.coverage)
        testCommand = "npx nyc --reporter text-summary --reporter html " + testCommand

    execSync(testCommand, {stdio: "inherit"});
}
