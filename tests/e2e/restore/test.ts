import {describe} from "mocha";
import {execSync} from "child_process";
import path from "path";
import waitForServer from "fullstacked/scripts/waitForServer";
import axios from "axios";
import sleep from "fullstacked/scripts/sleep";
import {notDeepEqual, deepEqual, ok} from "assert";
import fs from "fs";
import Runner from "../../../scripts/runner";
import config from "../../../scripts/config";
import build from "../../../scripts/build";
import {clearLine, printLine} from "../../../scripts/utils";

describe("Backup / Restore Test", function(){
    let testArr;
    let runner: Runner;
    const backupDir = path.resolve(__dirname, "backup");
    const backupFile = path.resolve(backupDir, "mongo-data.tar");

    before(async function (){
        this.timeout(30000);

        const localConfig = config({
            src: __dirname,
            silent: true
        })
        await build(localConfig);
        runner = new Runner(localConfig);
        await runner.start();
        printLine("Generating data");
        await waitForServer(10000);
        await sleep(3000);
        await axios.post("http://localhost:8000/post");
        testArr = (await axios.get("http://localhost:8000/get")).data;
    });

    it("Should backup / restore volume", async function(){
        this.timeout(50000);

        ok(testArr.length > 0);
        printLine("Backing up");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --volume=mongo-data --backupDir=${__dirname} --silent`);
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 0);
        runner.stop();
        printLine("Restarting");
        await sleep(5000)
        await runner.start();
        await waitForServer(10000);
        await sleep(3000);
        notDeepEqual((await axios.get("http://localhost:8000/get")).data, testArr);
        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore --volume=mongo-data --backupDir=${__dirname} --silent`);
        await waitForServer(5000);
        await sleep(3000);
        deepEqual((await axios.get("http://localhost:8000/get")).data, testArr);
        clearLine();
    });

    after(function() {
        if(fs.existsSync(backupDir))
            fs.rmSync(backupDir, {force: true, recursive: true});
        runner.stop();
    });
});
