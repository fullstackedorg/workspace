import puppeteer, {Browser, Page} from "puppeteer";
import v8toIstanbul from "v8-to-istanbul";
import fs from "fs";
import Runner from "../../scripts/runner";
import build from "../../scripts/build";
import config from "../../scripts/config";
import {cleanOutDir} from "../../scripts/utils";
import waitForServer from "../../scripts/waitForServer";

export default class Helper {
    dir: string;
    runner: Runner;
    browser: Browser;
    page: Page;
    localConfig: Config;

    constructor(dir: string) {
        this.dir = dir;
    }

    async start(pathURL: string = ""){
        this.localConfig = config({
            name: "test",
            src: this.dir,
            out: this.dir,
            silent: true
        });
        await build(this.localConfig);
        this.runner = new Runner(this.localConfig);
        await this.runner.start();
        this.browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        this.page = await this.browser.newPage();

        if(process.argv.includes("--coverage")){
            await this.page.coverage.startJSCoverage({
                includeRawScriptCoverage: true
            });
        }

        await waitForServer(3000);

        await this.page.goto("http://localhost:8000" + pathURL);

        process.on('uncaughtException', err => {
            if(this.browser?.close)
                this.browser.close();

            cleanOutDir(this.dir + "/dist");

            console.error(err);
            process.exit(1);
        });

        if(process.argv.includes("--coverage")) {
            const originalGoto = this.page.goto;
            const weakThis = this;
            // @ts-ignore
            this.page.goto = async function(path: string) {
                await Helper.outputCoverage(weakThis.page, weakThis.dir, weakThis.localConfig);
                await weakThis.page.coverage.startJSCoverage({
                    includeRawScriptCoverage: true
                });
                await originalGoto.apply(this, [path]);
            }
        }
    }

    private static async outputCoverage(page, dir, localConfig){
        const jsCoverage = (await page.coverage.stopJSCoverage()).map(({rawScriptCoverage: coverage}) => {
            let url: URL;
            try{ url = new URL(coverage.url); }
            catch (e){ return false; }

            const file = url.pathname;
            const origin = url.origin;

            if(!file.endsWith(".js") || !origin.includes("localhost:8000"))
                return false;

            return {
                ...coverage,
                url: dir + "/dist/" + localConfig.version + "/public" + file
            }
        }).filter(Boolean);

        const outFolder = process.cwd() + "/.nyc_output";
        if(!fs.existsSync(outFolder))
            fs.mkdirSync(outFolder);

        for (let i = 0; i < jsCoverage.length; i++) {
            const script = v8toIstanbul(jsCoverage[i].url);
            await script.load();
            script.applyCoverage(jsCoverage[i].functions);
            fs.writeFileSync(outFolder + "/webapp-" +
                Math.floor(Math.random() * 10000) + "-" + Date.now() + ".json", JSON.stringify(script.toIstanbul()))
            script.destroy();
        }
    }

    async stop(){
        if(process.argv.includes("--coverage")){
            await Helper.outputCoverage(this.page, this.dir, this.localConfig);
        }

        await this.browser.close();
        this.runner.stop();
        cleanOutDir(this.dir + "/dist");
    }
}
