import {describe} from "mocha";
import {execSync} from "child_process";
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
    const backupDir = path.resolve(__dirname, "backup");
    const backupFile = path.resolve(backupDir, "mongo-data.tar");

    before(async function (){
        this.timeout(30000);

        const localConfig = config({
            src: __dirname,
            silent: true
        });
        await build({...localConfig, testMode: true});
        runner = new Runner(localConfig);
        await runner.start();
        printLine("Generating data");
        await waitForServer(10000, "http://localhost:8000/get");
        await fetch.post("http://localhost:8000/post");
        testArr = await fetch.get("http://localhost:8000/get");
    });

    it("Should backup / restore volume", async function(){
        this.timeout(50000);

        ok(testArr.length > 0);
        printLine("Backing up");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --volume=mongo-data --backup-dir=${__dirname} --silent`);
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 0);
        runner.stop();
        printLine("Restarting");
        await sleep(5000)
        await runner.start();
        await waitForServer(10000);
        await sleep(3000);
        notDeepEqual(await fetch.get("http://localhost:8000/get"), testArr);
        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore --volume=mongo-data --backup-dir=${__dirname} --silent`);
        await waitForServer(10000, "http://localhost:8000/get");
        deepEqual(await fetch.get("http://localhost:8000/get"), testArr);
        clearLine();
    });

    after(function() {
        if(fs.existsSync(backupDir))
            fs.rmSync(backupDir, {force: true, recursive: true});
        runner.stop();
    });
});
