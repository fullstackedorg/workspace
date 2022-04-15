import path from "path";
import child_process from "child_process";
import {killProcess} from "./utils";

//@ts-ignore
process.env.FORCE_COLOR = true;

export default function(config){
    const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");


    let testCommand = "npx mocha \"./**/test.ts\" --config " + mochaConfigFile;

    if(config.coverage)
        testCommand = "npx nyc --reporter text-summary --reporter html " + testCommand


    const testProcess = child_process.exec(testCommand);
    testProcess.stdout.on('data', (message) => {
        process.stdout.write(message);

        if(message.includes("Error:"))
            killProcess(testProcess);
    })
    testProcess.stderr.pipe(process.stderr)
}
