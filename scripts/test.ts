import path from "path";
import child_process from "child_process";
import {killProcess} from "./utils";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config){
    const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");

    let testCommand = "npx mocha \"./**/test.ts\" --config " + mochaConfigFile + " " +
        (config.headless ? "--headless" : "") + " " +
        (config.coverage ? "--coverage" : "");

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
