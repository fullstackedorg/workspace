import child_process from "child_process";
import puppeteer from "puppeteer";
import v8toIstanbul from "v8-to-istanbul";
import fs from "fs";
import {killProcess} from "../../scripts/utils";

export default class {
    dir;
    serverProcess;
    browser;
    page;

    constructor(appDir: string) {
        this.dir = appDir
        process.stdout.write(child_process.execSync(`npx fullstacked --src=${this.dir} --out=${this.dir} --silent`));
    }

    async start(path: string = ""){
        this.serverProcess = child_process.exec("node " + this.dir + "/dist/index.js");
        this.browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        this.page = await this.browser.newPage();

        if(process.argv.includes("--coverage")){
            await this.page.coverage.startJSCoverage({
                includeRawScriptCoverage: true,
                resetOnNavigation: false
            });
        }

        await this.page.goto("http://localhost:8000" + path);

        process.on('uncaughtException', err => {
            if(this.serverProcess?.kill)
                this.serverProcess.kill();

            if(this.browser?.close)
                this.browser.close();

            console.error(err);
            process.exit(1);
        });
    }

    private async outputCoverage(){
        const jsCoverage = (await this.page.coverage.stopJSCoverage()).map(({rawScriptCoverage: coverage}) => {
            const url = new URL(coverage.url)
            const file = url.pathname;
            const origin = url.origin;
            if(!file.endsWith(".js") || origin !== "http://localhost:8000")
                return false;

            return {
                ...coverage,
                url: this.dir + "/dist/public" + file
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
            await this.outputCoverage();
        }

        await this.browser.close();
        this.serverProcess.kill();
        await killProcess(this.serverProcess, 8000)
    }
}
