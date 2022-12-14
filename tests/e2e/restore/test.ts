import {describe, it, before, after} from 'mocha';
import {exec, execSync} from "child_process";
import path from "path";
import waitForServer from "fullstacked/scripts/waitForServer";
import {notDeepEqual, deepEqual, ok} from "assert";
import fs from "fs";
import Runner from "../../../scripts/runner";
import Config from "../../../scripts/config";
import Build from "../../../scripts/build";
import {clearLine, printLine} from "../../../scripts/utils";
import {fetch} from "fullstacked/webapp/fetch";

describe("Backup-Restore Test", function(){
    let testArr;
    let runner: Runner;
    let localConfig;
    const backupDir = path.resolve(process.cwd(), "backup");
    const backupFile = path.resolve(backupDir, "mongo-data.tar");

    before(async function (){
        this.timeout(30000);

        localConfig = await Config({
            src: __dirname,
            silent: true
        });
        await Build({...localConfig, testMode: true});
        runner = new Runner(localConfig);
        await runner.start();
        printLine("Generating data");
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);

        await fetch.post(`http://localhost:${runner.nodePort}/post`);

        testArr = await fetch.get(`http://localhost:${runner.nodePort}/get`);
    });

    it("Should backup / restore volume",  async function(){
        this.timeout(100000);

        ok(testArr.length > 0);
        printLine("Backing up");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --silent`);
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 0);
        await runner.stop();
        printLine("Restarting");
        await runner.start();
        await waitForServer(30000, `http://localhost:${runner.nodePort}/get`);

        const response = await fetch.get(`http://localhost:${runner.nodePort}/get`);
        notDeepEqual(response, testArr);

        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore --silent`);
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);

        const response2 = await fetch.get(`http://localhost:${runner.nodePort}/get`);
        deepEqual(response2, testArr);
        clearLine();
    });

    it("Should start with volume restored",  async function(){
        this.timeout(50000);

        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --silent`);

        const runProcess = exec(`node ${path.resolve(__dirname, "../../../", "cli")} run --src=${localConfig.src} --restored`);
        await waitForServer(30000, `http://localhost:${runner.nodePort}/get`);

        const response = await fetch.get(`http://localhost:${runner.nodePort}/get`);
        deepEqual(response, testArr);

        runProcess.kill();
    });

    after(async function() {
        if(fs.existsSync(backupDir))
            fs.rmSync(backupDir, {force: true, recursive: true});

        await runner.stop();
    });
});
