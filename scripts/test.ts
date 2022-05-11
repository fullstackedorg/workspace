import path from "path";
import child_process from "child_process";
import {killProcess} from "./utils";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config){
    const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");

    const testFiles = path.resolve(process.cwd(), (config.root ?? ""), "**/test.ts");

    let testCommand = `npx mocha "${testFiles}" --config ` + mochaConfigFile + " " +
        (config.headless ? "--headless" : "") + " " +
        (config.coverage ? "--coverage" : "") + " " +
        (config.root ? "--root=" + config.root : "");

    if(config.coverage)
        testCommand = "npx nyc --reporter text-summary --reporter html " + testCommand

    const testProcess = child_process.exec(testCommand);
    testProcess.stderr.pipe(process.stderr)
    testProcess.stdout.on('data', (message) => {
        process.stdout.write(message);

        if(message.toString().includes("Error:") || message.toString().includes("AssertionError")) {
            killProcess(testProcess, 8000);
        }
    })
}
