import path from "path";
import glob from "glob";
import {run} from "node:test";
import {buildSync} from "esbuild";
import {defaultEsbuildConfig} from "./utils";
import fs from "fs";

export default function(config: Config){
    let testFiles = config.testFile
        ? [config.testFile]
        : glob.sync(path.resolve(config.src, "**", "*test.ts"));

    testFiles = testFiles.map(testFile => {
        const esbuildConfig = defaultEsbuildConfig(testFile);
        buildSync(esbuildConfig);
        return esbuildConfig.outfile;
    });

    if(config.headless)
        fs.writeFileSync(path.resolve(process.cwd(), ".headless"), "");

    const tapStream = run({files: testFiles});
    tapStream.on("close", () => {
        if(config.headless)
            fs.rmSync(path.resolve(process.cwd(), ".headless"));
    });
    tapStream.pipe(process.stdout);
}
