import {before, describe} from "mocha";
import child_process from "child_process";
import puppeteer from "puppeteer";
import {sleep} from "utils";
import fs from "fs";
import {killProcess} from "scripts/utils";
import {equal, ok, notEqual} from "assert";

describe("Watch Test", function(){
    let watchProcess, browser, page;
    const indexFile = __dirname + "/index.tsx";
    const serverFile = __dirname + "/server.ts";

    before(async function (){
        if(fs.existsSync(indexFile)) fs.rmSync(indexFile);
        if(fs.existsSync(serverFile)) fs.rmSync(serverFile);

        await fs.copyFileSync(__dirname + "/template-index.tsx", indexFile);
        await fs.copyFileSync(__dirname + "/template-server.ts", serverFile);

        watchProcess = child_process.exec(`fullstacked watch --src=${__dirname} --out=${__dirname} --silent`);
        await sleep(2000);
        browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        page = await browser.newPage();
        await page.coverage.startJSCoverage({
            includeRawScriptCoverage: true,
            resetOnNavigation: false
        });
        await page.goto("http://localhost:8000");
    });

    async function getReloadCount(){
        const root = await page.$("#reloadCount");
        const innerHTML = await root.getProperty('innerHTML');
        const value = Number(await innerHTML.jsonValue());
        return Number(value);
    }

    it('Should reload webapp', async function(){
        const countBefore = await getReloadCount();
        await sleep(1500);

        fs.appendFileSync(indexFile, "\n// this is a test line");
        await sleep(1500);

        const countAfter = await getReloadCount();
        equal(countAfter - countBefore, 1);
    });

    async function getBootTime(){
        if(!browser.isConnected()) {
            await browser.close();
            browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
            page = await browser.newPage();
            await page.goto("http://localhost:8000");
            await sleep(1000);
        }
        const root = await page.$("#bootTime");
        const innerHTML = await root.getProperty('innerHTML');
        const value = Number(await innerHTML.jsonValue());
        return Number(value);
    }

    it('Should reload server', async function(){
        const timeBefore = await getBootTime();
        ok(timeBefore)

        fs.appendFileSync(serverFile, "\n// this is a test line");
        await sleep(1500);
        const timeAfter = await getBootTime();

        ok(timeAfter)
        notEqual(timeBefore, timeAfter);
    });

    after(async function(){
        await browser.close();
        await killProcess(watchProcess, 8000);

        if(fs.existsSync(indexFile)) fs.rmSync(indexFile);
        if(fs.existsSync(serverFile)) fs.rmSync(serverFile);
    });
});
