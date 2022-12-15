import path, {dirname, resolve} from "path";
import {execSync} from "child_process";
import glob from "glob";
import fs from "fs";
import {fileURLToPath} from "url";
import Mocha from "mocha";
import {buildSync} from "esbuild";
import {defaultEsbuildConfig} from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function(config: Config){
    const mocha = new Mocha({
        timeout: 20000
    });

    const testFile = resolve(__dirname, "..", "tests", "e2e", "basic", "test.ts");

    const buildConfig = defaultEsbuildConfig(testFile);
    buildSync(buildConfig);
    buildSync(defaultEsbuildConfig(resolve(__dirname, "..", "tests", "e2e", "Helper.ts")));

    mocha.addFile(buildConfig.outfile);

    mocha.loadFilesAsync().then(() => mocha.run())


    // const mochaConfigFile = path.resolve(__dirname, "../.mocharc.js");
    //
    // // gather all test.ts files
    // let testFiles = config.testFile ?? path.resolve(config.src, "**", "*test.ts");
    //
    // let testCommand = "npx mocha \"" + testFiles + "\" " +
    //     "--config " + mochaConfigFile + " " +
    //     "--reporter " + path.resolve(__dirname, "..", "mocha-reporter.js") + " " +
    //     (config.testSuite ? "--grep \"" + config.testSuite + "\"" : "") + " " +
    //     (config.headless ? "--headless" : "") + " " +
    //     (config.coverage ? "--coverage" : "") + " " +
    //     (config.testMode ? "--test-mode" : "") + " ";
    //
    // // use nyc for coverage
    // if(config.coverage) {
    //     testCommand = "npx nyc" + " " +
    //         "--silent" + " " +
    //         "--temp-dir " + path.resolve(config.src, ".nyc_output") + " " +
    //         (config.testMode ? "--no-clean" : "") + " " +
    //         testCommand;
    // }
    //
    // let env = process.env;
    // if(parseInt(process.version.split(".").at(0).match(/\d+/).at(0)) >= 18){
    //     env["NODE_OPTIONS"] = "--no-experimental-fetch";
    // }
    // env["PUPPETEER_PRODUCT"] = "chrome";
    // execSync(testCommand, {stdio: "inherit", env: env});
    //
    // if(config.coverage && !config.testMode){
    //     glob.sync(path.resolve(config.src, ".nyc_output", "*.json")).forEach(file => {
    //         const content = fs.readFileSync(file, {encoding: 'utf-8'});
    //         const updatedContent = content.replace(/\/app\/.*?\./g, value => {
    //             const pathComponents = value.split("/");
    //             pathComponents.shift(); // remove ""
    //             pathComponents.shift(); // remove "app"
    //             const updatedPath = path.resolve(config.src,  pathComponents.join(path.sep));
    //             return path.sep === "\\" ? updatedPath.replace(/\\/g, "\\\\") : updatedPath;
    //         });
    //         fs.writeFileSync(file, updatedContent);
    //     });
    //
    //     execSync("npx nyc report" + " " +
    //         "--reporter html" + " " +
    //         "--reporter text-summary" + " " +
    //         "--report-dir " + path.resolve(config.src, "coverage") + " " +
    //         "--temp-dir " + path.resolve(config.src, ".nyc_output"), {stdio: "inherit"});
    // }
}
