import {before, describe} from "mocha";
import {execSync} from "child_process";
import puppeteer from "puppeteer";
import {equal, ok} from "assert";
import fs from "fs";
import path from "path";
import {clearLine, deleteBuiltTSFile, isDockerInstalled, printLine} from "../../../scripts/utils";

describe("Deploy test", function(){
    const containerName = "centos";
    const sshPort = "2222";
    let browser;

    const predeployOutputFile = path.resolve(__dirname, "predeploy.txt");
    const predeployAsyncOutputFile = path.resolve(__dirname, "predeploy-2.txt");
    const postdeployOutputFile = path.resolve(__dirname, "postdeploy.txt");
    const postdeployAsyncOutputFile = path.resolve(__dirname, "postdeploy-2.txt");

    before(async function (){
        this.timeout(50000);

        if(!await isDockerInstalled())
            throw Error("Deploy test needs Docker");

        printLine("Setting up docker container centos");
        execSync(`docker run --privileged -d -t -p ${sshPort}:22 -p 8000:8000 --name ${containerName} centos`);
        execSync(`docker exec ${containerName} bash -c "sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-Linux-*"`);
        execSync(`docker exec ${containerName} bash -c "sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-Linux-*"`);
        printLine("Installing ssh server");
        execSync(`docker exec ${containerName} yum install openssh-server -q -y > /dev/null 2>&1`);
        execSync(`docker exec ${containerName} bash -c "echo \"PasswordAuthentication yes\" >> /etc/ssh/sshd_config"`);
        execSync(`docker exec ${containerName} ssh-keygen -A`);
        execSync(`docker exec ${containerName} bash -c "echo \"root:centos\" | chpasswd"`);
        execSync(`docker exec -d ${containerName} /usr/sbin/sshd -D`);
        printLine("Running deployment command");
        execSync(`node ${path.resolve(__dirname, "../../../cli")} deploy
            --silent
            --port=8000
            --src=${__dirname}
            --out=${__dirname}
            --skip-test
            --y
            --host=localhost
            --ssh-port=${sshPort}
            --user=root
            --pass=centos
            --app-dir=/home
            --rootless
            --silent
            --test
            --docker-extra-flags="--storage-opt mount_program=/usr/bin/fuse-overlayfs"
        `.replace(/\n/g, ' '));
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
        browser = await puppeteer.launch({headless: process.argv.includes("--headless")});
        const page = await browser.newPage();
        await page.goto("http://localhost:8000");
        const root = await page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "<div>Deploy Test</div>");
    });

    it("Should have executed postdeploy", function(){
        ok(fs.existsSync(postdeployOutputFile));
        equal(fs.readFileSync(postdeployOutputFile, {encoding: "utf8"}), "postdeploy");
    });

    it("Should have awaited default export postdeploy", function(){
        ok(fs.existsSync(postdeployAsyncOutputFile));
        equal(fs.readFileSync(postdeployAsyncOutputFile, {encoding: "utf8"}), "postdeploy async");
    });

    after(function(){
        browser.close();
        fs.rmSync(path.resolve(__dirname, "dist"), {force: true, recursive: true});
        fs.rmSync(path.resolve(__dirname, "Dockerfile"), {force: true});
        fs.rmSync(path.resolve(__dirname, "out.tar"), {force: true});

        fs.rmSync(predeployOutputFile);
        fs.rmSync(predeployAsyncOutputFile);
        fs.rmSync(postdeployOutputFile);
        fs.rmSync(postdeployAsyncOutputFile);

        execSync(`docker rm -f ${containerName}`);
    });
});
