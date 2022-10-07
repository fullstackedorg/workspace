import {describe} from "mocha";
import {exec, execSync} from "child_process";
import path from "path";
import waitForServer from "fullstacked/scripts/waitForServer";
import sleep from "fullstacked/scripts/sleep";
import {notDeepEqual, deepEqual, ok} from "assert";
import fs from "fs";
import Runner from "../../../scripts/runner";
import config from "../../../scripts/config";
import build from "../../../scripts/build";
import {clearLine, printLine} from "../../../scripts/utils";
import {fetch} from "fullstacked/webapp/fetch";

describe("Backup-Restore Test", function(){
    let testArr;
    let runner: Runner;
    const localConfig = config({
        src: __dirname,
        silent: true
    });
    const backupDir = path.resolve(process.cwd(), "backup");
    const backupFile = path.resolve(backupDir, "mongo-data.tar");

    before(async function (){
        this.timeout(30000);

        await build({...localConfig, testMode: true});
        runner = new Runner(localConfig);
        await runner.start();
        printLine("Generating data");
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);
        await fetch.post(`http://localhost:${runner.nodePort}/post`);
        testArr = await fetch.get(`http://localhost:${runner.nodePort}/get`);
    });

    it("Should backup / restore volume", async function(){
        this.timeout(50000);

        ok(testArr.length > 0);
        printLine("Backing up");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --silent`);
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 0);
        runner.stop();
        printLine("Restarting");
        await sleep(5000)
        await runner.start();
        await waitForServer(10000);
        await sleep(3000);
        notDeepEqual(await fetch.get(`http://localhost:${runner.nodePort}/get`), testArr);
        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore --silent`);
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);
        deepEqual(await fetch.get(`http://localhost:${runner.nodePort}/get`), testArr);
        clearLine();
    });

    it("Should start with volume restored", async function(){
        this.timeout(50000);

        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --silent`);

        const runProcess = exec(`node ${path.resolve(__dirname, "../../../", "cli")} run --src=${localConfig.src} --restored`);
        await waitForServer(30000, `http://localhost:${runner.nodePort + 1}/get`);

        deepEqual(await fetch.get(`http://localhost:${runner.nodePort + 1}/get`), testArr);

        runProcess.kill();
    });

    after(function() {
        if(fs.existsSync(backupDir))
            fs.rmSync(backupDir, {force: true, recursive: true});

        runner.stop();
    });
});
