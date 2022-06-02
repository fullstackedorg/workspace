import {before, describe} from "mocha";
import {execSync} from "child_process";
import puppeteer from "puppeteer";
import {equal, notEqual, ok} from "assert";
import fs from "fs";
import path from "path";
import {cleanOutDir, clearLine, isDockerInstalled, printLine, silenceCommandLine} from "../../../scripts/utils";
import sleep from "fullstacked/scripts/sleep";

describe("Deploy Test", function(){
    const containerName = "dind";
    const sshPort = "2222";

    const predeployOutputFile = path.resolve(__dirname, "predeploy.txt");
    const predeployAsyncOutputFile = path.resolve(__dirname, "predeploy-2.txt");
    const postdeployOutputFile = path.resolve(__dirname, "postdeploy.txt");
    const postdeployAsyncOutputFile = path.resolve(__dirname, "postdeploy-2.txt");

    function executeDeployment(args: string){
        args += `
        --silent
        --y
        --skip-test
        --test-mode
        --host=localhost
        --ssh-port=${sshPort}
        --user=root
        --pass=docker
        --test-mode`;
        execSync(`node ${path.resolve(__dirname, "../../../cli")} deploy  ${args.replace(/\n/g, ' ')}`);
    }

    before(async function (){
        this.timeout(200000);

        if(!isDockerInstalled())
            throw Error("Deploy test needs Docker");

        execSync(silenceCommandLine(`docker rm -f ${containerName}`));
        printLine("Setting up docker container");
        execSync(`docker run --privileged -d -p ${sshPort}:22 -p 8000:80 -p 8443:443 --name ${containerName} docker:dind`);
        printLine("Installing ssh server");
        execSync(`docker exec ${containerName} apk add --update --no-cache openssh`);
        execSync(`docker exec ${containerName} sh -c "echo \\\"PasswordAuthentication yes\\\" >> /etc/ssh/sshd_config"`);
        execSync(`docker exec ${containerName} sh -c "echo \\\"PermitRootLogin yes\\\" >> /etc/ssh/sshd_config"`);
        execSync(`docker exec ${containerName} ssh-keygen -A`);
        execSync(`docker exec -d ${containerName} sh -c "echo -n \\\"root:docker\\\" | chpasswd"`);
        execSync(`docker exec -d ${containerName} /usr/sbin/sshd -D`);
        printLine("Running deployment command");
        executeDeployment(`
            --port=8000
            --src=${__dirname}
            --out=${__dirname}`);
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

    it("Should access deployed app over https", async function(){
        const browser = await puppeteer.launch({
            headless: process.argv.includes("--headless"),
            ignoreHTTPSErrors: true
        });
        const page = await browser.newPage();
        await page.goto("https://localhost:8443");
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

    it("Should overwrite current app", async function(){
        this.timeout(50000);
        printLine("Running deployment command for updated app");
        const updatedAppSrc = path.resolve(__dirname, "updated-app");
        executeDeployment(`
            --port=8000
            --src=${updatedAppSrc}
            --out=${updatedAppSrc}`);
        clearLine();

        const browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        const page = await browser.newPage();
        await page.goto("http://localhost:8000");
        const title = await page.$("h1");
        const innerHTML = await title.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();

        equal(value, "Deploy Test 2");

        await browser.close();
        cleanOutDir(path.resolve(updatedAppSrc, "dist"))
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
        executeDeployment(`
            --port=8000
            --src=${__dirname}
            --out=${__dirname}
            --version=0.0.0`);
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
        executeDeployment(`
            --src=${__dirname}
            --out=${__dirname}
            --port=8001
            --server-name=test.localhost
            --name=test
            --title=Test`);
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
        cleanOutDir(path.resolve(__dirname, "dist"))
        fs.rmSync(predeployOutputFile, {force: true});
        fs.rmSync(predeployAsyncOutputFile, {force: true});
        fs.rmSync(postdeployOutputFile, {force: true});
        fs.rmSync(postdeployAsyncOutputFile, {force: true});

        execSync(`docker rm -f ${containerName} -v`);
    });
});
