import puppeteer, {Browser, Page} from "puppeteer";
import fs from "fs";
import Runner from "./runner";
import Build from "../commands/build";
import Config from "./config";
import {cleanOutDir} from "./utils";
import waitForServer from "./waitForServer";
import {resolve} from "path";
import {FullStackedConfig} from "../index";

export default class TestE2E {
    dir: string;
    runner: Runner;
    browser: Browser;
    page: Page;
    localConfig: FullStackedConfig;
    timeout = 20000;

    constructor(dir: string) {
        this.dir = dir;
    }

    async init(): Promise<number>{
        this.localConfig = await Config({
            name: "test",
            src: this.dir,
            out: this.dir,
            silent: true
        });
        await Build(this.localConfig);
        this.runner = new Runner(this.localConfig);

        if(this.runner.dockerCompose.recipe?.services?.node?.command?.some(arg => arg.includes("installNative")))
            this.timeout = 60000;

        return this.timeout;
    }

    async start(pathURL: string = ""){
        if(!this.localConfig)
            await this.init();

        await this.runner.start();
        this.browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        this.page = await this.browser.newPage();

        if(process.argv.includes("--cover")){
            await this.page.coverage.startJSCoverage({
                includeRawScriptCoverage: true,
                resetOnNavigation: false
            });
        }

        await waitForServer(this.timeout, `http://localhost:${this.runner.nodePort}`);

        await this.goto(pathURL);

        process.on('uncaughtException', err => {
            if(this.browser?.close)
                this.browser.close();

            cleanOutDir(this.dir + "/dist");

            console.error(err);
            process.exit(1);
        });

        if(process.argv.includes("--cover")) {
            const originalGoto = this.page.goto;
            const weakThis = this;
            // @ts-ignore
            this.page.goto = async function(path: string) {
                await TestE2E.outputCoverage(weakThis.page, weakThis.dir, weakThis.localConfig, weakThis.runner.nodePort);
                await weakThis.page.coverage.startJSCoverage({
                    includeRawScriptCoverage: true,
                    resetOnNavigation: false
                });
                await originalGoto.apply(this, [path]);
            }
        }
    }

    async goto(path: string){
        await this.page.goto(`http://localhost:${this.runner.nodePort}${path}`);
    }

    private static async outputCoverage(page, dir, localConfig, nodePort){
        const jsCoverage = (await page.coverage.stopJSCoverage()).map(({rawScriptCoverage: coverage}) => {
            let url: URL;

            try{ url = new URL(coverage.url); }
            catch (e){ return false; }

            const file = url.pathname;
            const origin = url.origin;

            if(!file.endsWith(".js") || !origin.includes(`localhost:${nodePort}`))
                return false;

            return {
                ...coverage,
                scriptId: String(coverage.scriptId),
                url: [
                    "file://",
                    dir.replace(/\\/g, "/").replace("C:", "/C:"),
                    "/dist/app/public",
                    file
                ].join("")
            }
        }).filter(Boolean);

        let srcDir = process.cwd();
        process.argv.forEach(arg => {
            if(!arg.startsWith("--src=")) return;
            srcDir = resolve(process.cwd(), arg.slice("--src=".length));
        });

        const outFolder = resolve(srcDir, ".c8");
        if(!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);

        const fileName = [
            outFolder,
            "/coverage-",
            Math.floor(Math.random() * 10000),
            "-",
            Date.now(),
            ".json"
        ];
        fs.writeFileSync(fileName.join(""), JSON.stringify({result: jsCoverage}));
    }

    async stop(){
        if(process.argv.includes("--cover")){
            await TestE2E.outputCoverage(this.page, this.dir, this.localConfig, this.runner.nodePort);
        }

        await this.browser.close();
        await this.runner.stop();
    }
}
