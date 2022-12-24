import {describe, it, before, after} from 'mocha';
import {exec, execSync} from "child_process";
import path, {dirname} from "path";
import waitForServer from "../../../utils/waitForServer";
import {notDeepEqual, deepEqual, ok} from "assert";
import fs from "fs";
import Runner from "../../../utils/runner";
import Config from "../../../utils/config";
import Build from "../../../commands/build";
import {clearLine, printLine} from "../../../utils/utils";
import {fetch} from "../../../utils/fetch";
import {fileURLToPath} from "url";
import sleep from "../../../utils/sleep";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Backup-Restore Test", function(){
    let localConfig;
    const backupDir = path.resolve(process.cwd(), "backup");
    const backupFile = path.resolve(backupDir, "mongo-data.tar");

    before(async function (){
        localConfig = await Config({
            src: __dirname,
            silent: true
        });
        await Build({...localConfig, testMode: true});
    });

    it("Should backup / restore volume",  async function(){
        this.timeout(200000);

        const runner = new Runner(localConfig);
        await runner.start();

        printLine("Generating data");
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);
        await fetch.post(`http://localhost:${runner.nodePort}/post`);
        const testArr = await fetch.get(`http://localhost:${runner.nodePort}/get`);

        ok(testArr.length > 0);
        printLine("Backing up");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --silent --src=${localConfig.src}`,
            {stdio: "ignore"});
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 0);
        await runner.stop();
        printLine("Restarting");
        await runner.start();
        await waitForServer(30000, `http://localhost:${runner.nodePort}/get`);

        const response = await fetch.get(`http://localhost:${runner.nodePort}/get`);
        notDeepEqual(response, testArr);

        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore --silent --src=${localConfig.src}`,
            {stdio: "ignore"});
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);

        const response2 = await fetch.get(`http://localhost:${runner.nodePort}/get`);
        deepEqual(response2, testArr);
        clearLine();

        await runner.stop();
    });

    it("Should start with volume restored",  async function(){
        this.timeout(200000);

        const runner = new Runner(localConfig);
        await runner.start();

        printLine("Generating data");
        await waitForServer(10000, `http://localhost:${runner.nodePort}/get`);
        await fetch.post(`http://localhost:${runner.nodePort}/post`);
        const testArr = await fetch.get(`http://localhost:${runner.nodePort}/get`);

        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup --silent --src=${localConfig.src}`,
            {stdio: "ignore"});

        await runner.stop();

        clearLine();

        const runProcess = exec(`node ${path.resolve(__dirname, "../../../", "cli")} run --src=${localConfig.src} --restored`);
        // runProcess.stdout.pipe(process.stdout);
        // runProcess.stderr.pipe(process.stderr);
        let response;
        while(!response || !response.length) {
            await sleep(2000);
            await waitForServer(30000, `http://localhost:${runner.nodePort}/get`);
            response = await fetch.get(`http://localhost:${runner.nodePort}/get`);
        }

        deepEqual(response, testArr);

        await runner.stop();
        runProcess.kill();
    });

    after(async function() {
        if(fs.existsSync(backupDir))
            fs.rmSync(backupDir, {force: true, recursive: true});
    });
});
