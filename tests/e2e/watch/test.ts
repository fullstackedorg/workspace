import {describe, it, before, after} from 'mocha';
import {exec} from "child_process";
import puppeteer from "puppeteer";
import fs from "fs";
import {cleanOutDir} from "../../../utils/utils";
import {equal, ok, notEqual} from "assert";
import path, {dirname} from "path";
import sleep from "../../../utils/sleep";
import waitForServer from "../../../utils/waitForServer";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Watch Test", function(){
    let watchProcess, browser, page;
    const webappFile = path.resolve(__dirname, "webapp", "index.ts");
    const indexHTML = path.resolve(__dirname, "webapp", "index.html");
    const indexCSS = path.resolve(__dirname, "webapp", "index.css");
    const serverFile = path.resolve(__dirname, "server", "index.ts");

    const preTest = path.resolve(__dirname, "pre-test.txt");
    const postTest = path.resolve(__dirname, "post-test.txt");

    const extraFile = path.resolve(__dirname, "extra.txt");
    const extraDir = path.resolve(__dirname, "extra");

    function deleteAllFiles(){
        if(fs.existsSync(webappFile)) fs.rmSync(webappFile);
        if(fs.existsSync(indexHTML)) fs.rmSync(indexHTML);
        if(fs.existsSync(indexCSS)) fs.rmSync(indexCSS);
        if(fs.existsSync(serverFile)) fs.rmSync(serverFile);
        if(fs.existsSync(preTest)) fs.rmSync(preTest);
        if(fs.existsSync(postTest)) fs.rmSync(postTest);
        if(fs.existsSync(extraFile)) fs.rmSync(extraFile);
        if(fs.existsSync(extraDir)) fs.rmSync(extraDir, {force: true, recursive: true});
    }

    before(async function (){
       deleteAllFiles();

        fs.copyFileSync(path.resolve(__dirname, "webapp", "template.ts"), webappFile);
        fs.copyFileSync(path.resolve(__dirname, "webapp", "template.html"), indexHTML);
        fs.copyFileSync(path.resolve(__dirname, "webapp", "template.css"), indexCSS);
        fs.copyFileSync(path.resolve(__dirname, "server", "template.ts"), serverFile);

        fs.writeFileSync(extraFile, "");
        fs.mkdirSync(extraDir);
        fs.writeFileSync(path.resolve(extraDir, "file.txt"), "");

        watchProcess = exec(`node ${path.resolve(__dirname, "../../../cli")} watch --src=${__dirname} --out=${__dirname} --silent --watch-file=extra.txt --watch-dir=extra`);
        // watchProcess.stdout.pipe(process.stdout);
        // watchProcess.stderr.pipe(process.stderr);

        await waitForServer(15000);

        browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        page = await browser.newPage();
        await page.goto("http://localhost:8000");
    });

    async function getCount(){
        const root = await page.$("#reloadCount");
        const innerHTML = await root.getProperty('innerHTML');
        const value = Number(await innerHTML.jsonValue());
        return Number(value);
    }

    async function getReloadCount(){
        let tries = 5, lastError;
        while (tries){
            try{
                return await getCount();
            }catch (e) {
                lastError = e;
                await sleep(1000);
                tries--;
            }
        }

        console.log("Unable to get reload count");
        throw lastError;
    }

    it('Should reload webapp when changing webapp/index.ts', async function(){
        const countBefore = await getReloadCount();
        await sleep(1000);

        fs.appendFileSync(webappFile, "\n// this is a test line");
        await sleep(1000);

        const countAfter = await getReloadCount();
        equal(countAfter - countBefore, 1);
    });

    it('Should reload webapp when changing webapp/index.html', async function(){
        const countBefore = await getReloadCount();
        await sleep(1000);

        fs.appendFileSync(indexHTML, "\n<div></div>");
        await sleep(1000);

        const countAfter = await getReloadCount();
        equal(countAfter - countBefore, 1);
    });

    it('Should reload webapp when changing webapp/index.css', async function(){
        const countBefore = await getReloadCount();
        await sleep(1000);

        fs.appendFileSync(indexCSS, "\ndiv{}");
        await sleep(1000);

        const countAfter = await getReloadCount();
        equal(countAfter - countBefore, 1);
    });

    async function getBootTime(){
        await sleep(1000);
        const root = await page.$("#bootTime");
        const innerHTML = await root.getProperty('innerHTML');
        const value = Number(await innerHTML.jsonValue());
        return Number(value);
    }

    it('Should reload server', async function(){
        const timeBefore = await getBootTime();
        ok(timeBefore)

        fs.appendFileSync(serverFile, "\n// this is a test line");
        await sleep(4000);
        const timeAfter = await getBootTime();

        ok(timeAfter)
        notEqual(timeBefore, timeAfter);
    });

    it('Should re-execute pre and post build', async function(){
        const getPreCount = () => parseInt(fs.readFileSync(postTest, {encoding: "utf-8"}));
        const getPostCount = () => parseInt(fs.readFileSync(postTest, {encoding: "utf-8"}));

        const preCount = getPreCount();
        const postCount = getPostCount();

        fs.appendFileSync(webappFile, "\n// this is a test line");
        await sleep(1000);

        ok(preCount < getPreCount());
        ok(postCount < getPostCount());
    });

    it('Should watch extra file', async function(){
        const countBefore = await getReloadCount();
        await sleep(1000);

        fs.appendFileSync(extraFile, "\n// this is a test line");
        await sleep(1000);

        const countAfter = await getReloadCount();
        equal(countAfter - countBefore, 1);
    });

    it('Should watch extra dir', async function(){
        const countBefore = await getReloadCount();
        await sleep(1000);

        fs.appendFileSync(path.resolve(extraDir, "file.txt"), "\n// this is a test line");
        await sleep(1000);

        const countAfter = await getReloadCount();
        equal(countAfter - countBefore, 1);
    });

    after(async function(){
        await browser.close();
        watchProcess.kill("SIGINT");

        await sleep(3000);

        deleteAllFiles();
        cleanOutDir(path.resolve(__dirname, "dist"));
    });
});
