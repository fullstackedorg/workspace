import {resolve} from "path";
import glob from "glob";
import Mocha, {Runner} from "mocha";
import {defaultEsbuildConfig, recursivelyBuildTS} from "../utils/utils.js";
import fs from "fs";
import {execSync} from "child_process";
import v8toIstanbul from "v8-to-istanbul";
import {FullStackedConfig} from "../index";

export default async function(config: FullStackedConfig){
    if(config.coverage){
        // make sure to disable experimental fetch if node >= 18
        // source: https://github.com/parcel-bundler/parcel/issues/8005#issuecomment-1120149358
        if(parseInt(process.version.split(".").at(0).match(/\d+/).at(0)) >= 18 && !process.execArgv.includes("--no-experimental-fetch")){
            const args = [...process.argv];
            args.shift();
            return execSync(["node", "--no-experimental-fetch", args].flat().join(" "), {stdio: "inherit"});
        }

        const testCommand = [...process.argv];
        testCommand.shift();

        const c8DataDir = config.c8OutDir || resolve(config.src, ".c8");

        const cmd = [
            "npx",
            "c8",
            "--reporter none",
            `--temp-directory ${c8DataDir}`,
            "--clean false",
            "node",
            ...testCommand,
            "--cover"
        ];
        cmd.splice(cmd.indexOf("--coverage"), 1);
        execSync(cmd.join(" "), {stdio: "inherit"});

        const istanbulDataDir = resolve(config.src, ".nyc");
        if(fs.existsSync(istanbulDataDir)) fs.rmSync(istanbulDataDir, {recursive: true});
        fs.mkdirSync(istanbulDataDir);

        const coverageFiles = glob.sync(resolve(c8DataDir, "*.json"));

        for (const file of coverageFiles){
            const jsCoverage = JSON.parse(fs.readFileSync(file, {encoding: "utf8"})).result;
            for (let i = 0; i < jsCoverage.length; i++) {
                const modulePath = jsCoverage[i].url.replace("/C:", "");

                if(!fs.existsSync(modulePath.slice("file://".length))
                    || modulePath.includes("node_modules")) continue;

                const script = v8toIstanbul(jsCoverage[i].url);
                await script.load();
                script.applyCoverage(jsCoverage[i].functions);
                fs.writeFileSync(istanbulDataDir + "/coverage-" +
                    Math.floor(Math.random() * 10000) + "-" + Date.now() + ".json", JSON.stringify(script.toIstanbul()))
                script.destroy();
            }
        }

        const coverageOutDir = config.reportDir
            ? resolve(process.cwd(), config.reportDir)
            : resolve(config.src, "coverage");

        if(fs.existsSync(coverageOutDir)) {
            fs.readdirSync(coverageOutDir).forEach(item => {
                if (item.startsWith(".")) return;
                fs.rmSync(resolve(coverageOutDir, item), {recursive: true});
            });
        }

        const reportCMD = ["npx nyc report",
            "--reporter=html",
            "--reporter=text-summary",
            `--report-dir=${coverageOutDir}`,
            `--temp-directory=${istanbulDataDir}`];

        execSync(reportCMD.join(" "), {stdio: "inherit"});

        fs.rmSync(c8DataDir, {recursive: true});
        fs.rmSync(istanbulDataDir, {recursive: true});
        return;
    }

    const mocha = new Mocha({
        timeout: 20000,
        reporter: specExt,
        grep: config.testSuite
    });

    const ignore = [
        "**/.test/**",
        "**/dist/**"
    ];

    if(config.ignore){
        if(Array.isArray(config.ignore)) ignore.push(...config.ignore);
        else ignore.push(config.ignore);
    }

    const testFiles = config.testFile
        ? [resolve(process.cwd(), config.testFile)]
        : glob.sync(resolve(config.src, "**", "*test.ts"), {ignore});

    const esbuildConfigs = testFiles.map(testFile => defaultEsbuildConfig(testFile));
    for(const testFile of testFiles){
        await recursivelyBuildTS(testFile);
    }
    esbuildConfigs.forEach(esbuildConfig => mocha.addFile(esbuildConfig.outfile));

    await mocha.loadFilesAsync();
    mocha.run();
}

function specExt(runner: Runner){
    runner.on(Mocha.Runner.constants.EVENT_RUN_END, function() {
        if(!global.integrationTests)
            global.integrationTests = {count: 0, passes: 0, failures: 0};

        runner.stats.passes += global.integrationTests.passes;
        runner.stats.failures += global.integrationTests.failures;
    });

    Mocha.reporters.Spec.call(this, runner);

    const passTestListeners = runner.listeners(Mocha.Runner.constants.EVENT_TEST_PASS);
    runner.removeAllListeners(Mocha.Runner.constants.EVENT_TEST_PASS);
    runner.on(Mocha.Runner.constants.EVENT_TEST_PASS, (test) => {
        if(test.title.startsWith("Internal Integration Test"))
            return;

        passTestListeners.forEach(listener => {
            listener(test);
        });
    });
}

(Mocha.utils as any).inherits(specExt, Mocha.reporters.Spec);
