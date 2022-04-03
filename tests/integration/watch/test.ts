import {before, describe} from "mocha";
import child_process from "child_process";
import puppeteer from "puppeteer";
import assert from "assert";
import {sleep} from "utils";
import fs from "fs";

describe("Watch Test", function(){
    let watchProcess, browser, page;
    const fixedDirName = __dirname.replace("/.tests", "");
    const indexFile = fixedDirName + "/index.tsx";
    const serverFile = fixedDirName + "/server.ts";

    before(async function (){
        watchProcess = child_process.exec(`fullstacked watch --src=${fixedDirName} --out=${fixedDirName} --silent`);
        await sleep(2000);
        browser = await puppeteer.launch();
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
        assert.equal(countAfter - countBefore, 1);
    });

    async function getBootTime(){
        const root = await page.$("#bootTime");
        const innerHTML = await root.getProperty('innerHTML');
        const value = Number(await innerHTML.jsonValue());
        return Number(value);
    }

    it('Should reload server', async function(){
        await sleep(1000);
        const timeBefore = await getBootTime();

        fs.appendFileSync(serverFile, "\n// this is a test line");
        await sleep(1500);
        const timeAfter = await getBootTime();

        assert.notEqual(timeBefore, timeAfter);
    });

    function clearTestLine(file){
        const content = fs.readFileSync(file, {encoding: "utf8"});
        const contentLines = content.split("\n");
        contentLines.pop();
        fs.writeFileSync(file, contentLines.join("\n"));
    }

    after(async function(){
        await browser.close();
        watchProcess.kill();
        // todo: this is violent and wont work on windows
        child_process.execSync("kill -9 $(lsof -t -i:8000)");

        clearTestLine(indexFile);
        clearTestLine(serverFile);
    });
});
