import {before, describe} from "mocha";
import {exec} from "child_process";
import puppeteer from "puppeteer";
import fs from "fs";
import {cleanOutDir} from "scripts/utils";
import {equal, ok, notEqual} from "assert";
import path from "path";
import sleep from "fullstacked/scripts/sleep";
import waitForServer from "fullstacked/scripts/waitForServer";

describe("Watch Test", function(){
    let watchProcess, browser, page;
    const indexFile = path.resolve(__dirname, "webapp.ts");
    const serverFile = path.resolve(__dirname, "server.ts");

    before(async function (){
        if(fs.existsSync(indexFile)) fs.rmSync(indexFile);
        if(fs.existsSync(serverFile)) fs.rmSync(serverFile);

        fs.copyFileSync(path.resolve(__dirname, "template-webapp.ts"), indexFile);
        fs.copyFileSync(path.resolve(__dirname, "template-server.ts"), serverFile);

        watchProcess = exec(`node ${path.resolve(__dirname, "../../../cli")} watch --src=${__dirname} --out=${__dirname} --silent`);

        await waitForServer(15000);

        browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        page = await browser.newPage();
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
        await sleep(1000);

        fs.appendFileSync(indexFile, "\n// this is a test line");
        await sleep(1000);

        const countAfter = await getReloadCount();
        equal(countAfter - countBefore, 1);
    });

    async function getBootTime(){
        await sleep(1000);

        if(browser && !browser.isConnected()) {
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
        await sleep(6000);
        const timeAfter = await getBootTime();

        ok(timeAfter)
        notEqual(timeBefore, timeAfter);
    });

    after(async function(){
        await browser.close();
        watchProcess.kill("SIGINT");

        await sleep(3000);

        if(fs.existsSync(indexFile)) fs.rmSync(indexFile);
        if(fs.existsSync(serverFile)) fs.rmSync(serverFile);
        cleanOutDir(path.resolve(__dirname, "dist"));
    });
});
