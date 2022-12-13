import {before, after, describe, it} from 'mocha';
import {execSync} from "child_process";
import puppeteer from "puppeteer";
import {equal, notEqual, ok} from "assert";
import fs from "fs";
import path from "path";
import {cleanOutDir, clearLine, printLine, saveDataEncryptedWithPassword} from "../../../scripts/utils";
import sleep from "fullstacked/scripts/sleep";
import waitForServer from "fullstacked/scripts/waitForServer";
import SSH from "../SSH";

describe("Deploy Test",  function(){
    const sshServer = new SSH();
    const serverNameFile = path.resolve(__dirname, ".fullstacked.json");

    const predeployOutputFile = path.resolve(__dirname, "predeploy.txt");
    const predeployAsyncOutputFile = path.resolve(__dirname, "predeploy-2.txt");
    const postdeployOutputFile = path.resolve(__dirname, "postdeploy.txt");
    const postdeployAsyncOutputFile = path.resolve(__dirname, "postdeploy-2.txt");

    function executeDeployment(src: string, args: string[] = [], serverName = "localhost"){
        saveDataEncryptedWithPassword(path.resolve(src, ".fullstacked"), "test", {
            sshCredentials: {
                host: "localhost",
                port: sshServer.sshPort,
                username: sshServer.username,
                password: sshServer.password,
                appDir: "/home"
            },
            nginxConfigs: [
                {
                    name: "node",
                    port: 80,
                    serverNames: [serverName]
                }
            ]
        })


        args = args.concat([
            `--src=${src}`,
            `--out=${src}`,
            "--y",
            "--password=test"
        ]);
        execSync(`node ${path.resolve(__dirname, "../../../cli")} deploy ${args.join(" ")}`, {stdio: "ignore"});
    }

    before(async function (){
        this.timeout(200000);

        await sshServer.init();
        printLine("Running deployment command");
        executeDeployment(__dirname);
        printLine("Deployment complete");
        await waitForServer(2000);
        clearLine();
    });

    it("Should have executed predeploy", function(){
        ok(fs.existsSync(predeployOutputFile));
        equal(fs.readFileSync(predeployOutputFile, {encoding: "utf8"}), "predeploy");
    });

    it("Should have awaited default export predeploy", function(){
        ok(fs.existsSync(predeployAsyncOutputFile));
        equal(fs.readFileSync(predeployAsyncOutputFile, {encoding: "utf8"}), "predeploy async");
    });

    it("Should access deployed app", async function(){
        const browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        const page = await browser.newPage();
        await page.goto("http://localhost:8000");
        const title = await page.$("h1");
        const innerHTML = await title.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();

        equal(value, "Deploy Test");

        await browser.close();
    });

    it("Should have executed postdeploy", function(){
        ok(fs.existsSync(postdeployOutputFile));
        equal(fs.readFileSync(postdeployOutputFile, {encoding: "utf8"}), "postdeploy");
    });

    it("Should have awaited default export postdeploy", function(){
        ok(fs.existsSync(postdeployAsyncOutputFile));
        equal(fs.readFileSync(postdeployAsyncOutputFile, {encoding: "utf8"}), "postdeploy async");
    });

    it("Should overwrite current app",  async function(){
        this.timeout(50000);

        printLine("Running deployment command for updated app");
        const updatedAppSrc = path.resolve(__dirname, "updated-app");
        executeDeployment(updatedAppSrc);
        clearLine();

        const browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        const page = await browser.newPage();
        await page.goto("http://localhost:8000");
        const title = await page.$("h1");
        const innerHTML = await title.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();

        equal(value, "Deploy Test 2");

        await browser.close();
        cleanOutDir(path.resolve(updatedAppSrc, "dist"));
    });

    it("Should re-deploy with new app version", async function(){
        this.timeout(50000);

        const browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        const page = await browser.newPage();
        await page.goto("http://localhost:8000");
        const version = await page.$("#version");
        const innerHTML = await version.getProperty('innerHTML');

        const currentAppVersion = await innerHTML.jsonValue();

        printLine("Running deployment command with new version");
        executeDeployment(__dirname, [`--version=0.0.0`]);
        clearLine();

        await sleep(1000);

        await page.reload();

        const versionUpdated = await page.$("#version");

        const innerHTML2 = await versionUpdated.getProperty('innerHTML');
        const updatedAppVersion = await innerHTML2.jsonValue();
        notEqual(updatedAppVersion, currentAppVersion);
        equal(updatedAppVersion, "0.0.0");

        await browser.close();
    });

    it("Should run another app", async function(){
        this.timeout(50000);

        printLine("Running deployment command with another app");
        executeDeployment(__dirname, [`--name=test`, `--title=Test`], "test.localhost");
        clearLine();

        const browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        const page = await browser.newPage();
        await page.goto("http://localhost:8000");
        const currentTitle = await page.title();

        await page.goto("http://test.localhost:8000");
        const secondTitle = await page.title();

        notEqual(secondTitle, currentTitle);
        equal(secondTitle, "Test");

        await browser.close();
    });

    after(function(){
        cleanOutDir(path.resolve(__dirname, "dist"));
        fs.rmSync(serverNameFile, {force: true});
        fs.rmSync(predeployOutputFile, {force: true});
        fs.rmSync(predeployAsyncOutputFile, {force: true});
        fs.rmSync(postdeployOutputFile, {force: true});
        fs.rmSync(postdeployAsyncOutputFile, {force: true});
        sshServer.stop();
    });
});
