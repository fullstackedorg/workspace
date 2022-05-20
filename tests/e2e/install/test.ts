import {before, describe} from "mocha";
import {clearLine, killProcess, printLine} from "../../../scripts/utils";
import {exec, execSync} from "child_process";
import fs from "fs";
import path from "path";
import {equal} from "assert";
import puppeteer from "puppeteer";

describe("Install Test", function(){
    const outDir = path.resolve(__dirname, "dist");
    let packageName, appProcess, browser;

    before(async function (){
        this.timeout(60000);

        fs.mkdirSync(outDir);
        printLine("Packing");
        execSync(`npm pack -q --pack-destination ${outDir}`);
        packageName = fs.readdirSync(outDir)[0];
        printLine("Installing");
        execSync(`npm init -y`, {cwd: outDir});
        execSync(`npm i ${packageName}`, {cwd: outDir});
        printLine("Create");
        execSync(`npx fullstacked create`, {cwd: outDir});
        printLine("Build");
        execSync(`npx fullstacked build`, {cwd: outDir});
        printLine("Run");
        appProcess = exec(`node dist/index`, {cwd: outDir});
        clearLine();
    })

    it('Should display starter app', async function(){
        browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        const page = await browser.newPage();
        await page.goto("http://localhost:8000");
        const root = await page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Welcome to FullStacked!");
    });

    after(async function(){
        await browser.close()
        await killProcess(appProcess, 8000);
        fs.rmSync(outDir, {force: true, recursive: true});
    });
});
