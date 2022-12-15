import path, {dirname, resolve} from "path";
import glob from "glob";
import {fileURLToPath} from "url";
import Mocha, {Runner} from "mocha";
import {buildSync, build} from "esbuild";
import {defaultEsbuildConfig} from "./utils.js";
import * as process from "process";
import fs, {existsSync} from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function(config: Config){
    const mocha = new Mocha({
        timeout: 20000,
        reporter: specExt
    });

    const testFiles = config.testFile
        ? [resolve(process.cwd(), config.testFile)]
        : glob.sync(resolve(config.src, "**", "*test.ts"));

    if(!process.argv.includes("--test-mode")){
        const esbuildConfigs = testFiles.map(testFile => defaultEsbuildConfig(testFile));
        await Promise.all(esbuildConfigs.map(esbuildConfig => {
            return new Promise<void>(async res => {
                await build(esbuildConfig);

                const bundlingFile = resolve(__dirname, ".bundling");
                await build({
                    entryPoints: esbuildConfig.entryPoints,
                    outfile: bundlingFile,
                    bundle: true,
                    plugins: [{
                        name: "build-needed-ts",
                        setup(build){
                            build.onResolve({filter: /.*/}, (args) => {
                                if(args.kind === "entry-point") return null;

                                if(!args.path.endsWith(".js") || !args.path.startsWith(".")) return {external: true};

                                const filePathToBuild = resolve(path.dirname(esbuildConfig.entryPoints[0]), args.path);
                                buildSync(defaultEsbuildConfig(filePathToBuild.replace(/\.js$/, ".ts")));

                                return {external: true};
                            })
                        }
                    }]
                });

                if(fs.existsSync(bundlingFile)) fs.rmSync(bundlingFile);
                res();
            });
        }));

        esbuildConfigs.forEach(esbuildConfig => {
            mocha.addFile(esbuildConfig.outfile);
        });
    }else{
        testFiles.forEach(testFile => mocha.addFile(testFile));
    }

    mocha.loadFilesAsync().then(() => mocha.run());


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

function specExt(runner: Runner){
    runner.on(Mocha.Runner.constants.EVENT_RUN_END, function() {
        if(process.argv.includes("--test-mode")) return;

        if(!global.integrationTests)
            global.integrationTests = {passes: 0, failures: 0};

        runner.stats.passes += global.integrationTests.passes;
        runner.stats.failures += global.integrationTests.failures;
    });

    Mocha.reporters.Spec.call(this, runner);

    const passTestListeners = runner.listeners(Mocha.Runner.constants.EVENT_TEST_PASS);
    runner.removeAllListeners(Mocha.Runner.constants.EVENT_TEST_PASS);
    runner.on(Mocha.Runner.constants.EVENT_TEST_PASS, (test) => {
        if(test.title.startsWith("Integration"))
            return;

        passTestListeners.forEach(listener => {
            listener(test);
        });
    });
}

(Mocha.utils as any).inherits(specExt, Mocha.reporters.Spec);
