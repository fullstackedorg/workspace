import "../../../scripts/register";
import {describe, it, before, after} from "node:test";
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
        await build({...localConfig, testMode: true});
        runner = new Runner(localConfig);
        await runner.start();
        printLine("Generating data");
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);

        await fetch(`http://localhost:${runner.nodePort}/post`, {method: "post"});

        const res = await fetch(`http://localhost:${runner.nodePort}/get`);
        testArr = await res.json();
    });

    it("Should backup / restore volume",  async function(){
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

        const res = await fetch(`http://localhost:${runner.nodePort}/get`);
        notDeepEqual(await res.json(), testArr);

        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore --silent`);
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);

        const res2 = await fetch(`http://localhost:${runner.nodePort}/get`)
        deepEqual(await res2.json(), testArr);
        clearLine();
    });

    it("Should start with volume restored",  async function(){
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --silent`);

        const runProcess = exec(`node ${path.resolve(__dirname, "../../../", "cli")} run --src=${localConfig.src} --restored`);
        await waitForServer(30000, `http://localhost:${runner.nodePort + 1}/get`);

        const res = await fetch(`http://localhost:${runner.nodePort + 1}/get`);
        deepEqual(await res.json(), testArr);

        runProcess.kill();
    });

    after(function() {
        if(fs.existsSync(backupDir))
            fs.rmSync(backupDir, {force: true, recursive: true});

        runner.stop();
    });
});
