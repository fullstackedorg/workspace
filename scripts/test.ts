import path from "path";
import child_process from "child_process";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config){
    return new Promise<void>(resolve => {
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

        const testProcess = child_process.exec(testCommand);
        testProcess.stderr.pipe(process.stderr)
        testProcess.stdout.pipe(process.stdout);

        testProcess.on("exit", resolve);
    });
}
