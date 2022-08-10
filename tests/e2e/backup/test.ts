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

describe("Backup / Restore Test", function(){
    let testArr;
    let runner: Runner = new Runner(config({
        src: __dirname
    }));
    const backupDir = path.resolve(__dirname, "backup");
    const backupFile = path.resolve(backupDir, "mongo-data.tar");

    before(async function (){
        await runner.start();
        await waitForServer(10000);
        await sleep(3000);
        await axios.post("http://localhost:8000/todos");
        testArr = (await axios.get("http://localhost:8000/todos")).data;
    });

    it("Should backup / restore volume", async function(){
        this.timeout(50000);

        ok(testArr.length > 0);
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --volume=mongo-data --backupDir=${__dirname}`, {stdio: "inherit"});
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 0);
        runner.stop();
        await sleep(5000)
        await runner.start();
        await waitForServer(10000);
        await sleep(3000);
        notDeepEqual((await axios.get("http://localhost:8000/todos")).data, testArr);
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore --volume=mongo-data --backupDir=${__dirname}`, {stdio: "inherit"});
        await waitForServer(5000);
        await sleep(3000);
        deepEqual((await axios.get("http://localhost:8000/todos")).data, testArr);
    });

    after(function() {
        if(fs.existsSync(backupDir))
            fs.rmSync(backupDir, {force: true, recursive: true});
        runner.stop();
    });
});
