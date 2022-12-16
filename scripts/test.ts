import path, {dirname, resolve} from "path";
import glob from "glob";
import {fileURLToPath} from "url";
import Mocha, {Runner} from "mocha";
import {buildSync, build} from "esbuild";
import {defaultEsbuildConfig} from "./utils.js";
import * as process from "process";
import fs from "fs";
import {execSync} from "child_process";
import v8toIstanbul from "v8-to-istanbul";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function(config: Config){
    if(config.coverage){
        // make sure to disable experimental fetch if node >= 18
        // source: https://github.com/parcel-bundler/parcel/issues/8005#issuecomment-1120149358
        if(parseInt(process.version.split(".").at(0).match(/\d+/).at(0)) >= 18 && !process.execArgv.includes("--no-experimental-fetch")){
            const args = [...process.argv];
            const command = args.shift();
            return execSync([command, "--no-experimental-fetch", args].flat().join(" "), {stdio: "inherit"});
        }


        const c8DataDir = resolve(config.src, ".c8");

        const cmd = [
            "npx",
            "c8",
            "-r none",
            "--skip-full true",
            `--temp-directory ${c8DataDir}`,
            (config.testMode ? "--clean false" : ""),
            ...process.argv,
            "--cover"
        ];
        cmd.splice(cmd.indexOf("--coverage"), 1);
        execSync(cmd.join(" "), {stdio: "inherit"});

        if(config.testMode) return;

        glob.sync(path.resolve(config.src, ".c8", "*.json")).forEach(file => {
            const content = fs.readFileSync(file, {encoding: 'utf-8'});
            const updatedContent = content.replace(/\/app\/.*?\./g, value => {
                const pathComponents = value.split("/");
                pathComponents.shift(); // remove ""
                pathComponents.shift(); // remove "app"
                const updatedPath = path.resolve(config.src,  pathComponents.join(path.sep));
                return path.sep === "\\" ? updatedPath.replace(/\\/g, "\\\\") : updatedPath;
            });
            fs.writeFileSync(file, updatedContent);
        });

        const istanbulDataDir = resolve(config.src, ".nyc");
        if(fs.existsSync(istanbulDataDir)) fs.rmSync(istanbulDataDir, {recursive: true});
        fs.mkdirSync(istanbulDataDir);

        const coverageFiles = glob.sync(resolve(c8DataDir, "*.json"));

        for (const file of coverageFiles){
            const jsCoverage = JSON.parse(fs.readFileSync(file, {encoding: "utf8"})).result;
            for (let i = 0; i < jsCoverage.length; i++) {
                const modulePath = jsCoverage[i].url;
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

        const coverageOutDir = resolve(config.src, "coverage");
        if(fs.existsSync(coverageOutDir)) fs.rmSync(coverageOutDir, {recursive: true});

        const reportCMD = ["npx nyc report",
            "--reporter=html",
            "--reporter=text-summary",
            `--report-dir=${coverageOutDir}`,
            `--temp-directory=${istanbulDataDir}`];

        return execSync(reportCMD.join(" "), {stdio: "inherit"});
    }

    const mocha = new Mocha({
        timeout: 20000,
        reporter: specExt,
        grep: config.testSuite
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
                            build.onResolve({filter: /.*/}, async (args) => {
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

    await mocha.loadFilesAsync();
    mocha.run();
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
