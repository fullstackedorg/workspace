import {describe, it, before, after} from 'mocha';
import SSH from "../SSH.js";
import {exec, execSync} from "child_process";
import path, {dirname} from "path";
import fs from "fs";
import waitForServer from "../../../scripts/waitForServer.js";
import {cleanOutDir, clearLine, printLine, saveDataEncryptedWithPassword} from "../../../scripts/utils.js";
import {deepEqual, notDeepEqual, ok} from "assert";
import sleep from "../../../scripts/sleep.js";
import {fetch} from "../../../webapp/fetch.js";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Backup-Restore Remotely Test", function(){
    const sshServer1 = new SSH();
    const sshServer2 = new SSH();
    const backupDir = path.resolve(process.cwd(), "backup");
    const outDir = path.resolve(__dirname, "out");
    let testArr = [];

    function setupRemoteDeployment(sshServer: SSH){
        return new Promise<void>(async (resolve, reject) => {
            if(sshServer === sshServer2)
                await sleep(2000);

            await sshServer.init();

            saveDataEncryptedWithPassword(path.resolve(__dirname, ".fullstacked"), "test", {
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
                        serverNames: ["localhost"]
                    }
                ]
            })

            const deployment = exec([`node ${path.resolve(__dirname, "../../../", "cli")} deploy`,
                `--src=${__dirname}`,
                `--out=${sshServer === sshServer1 ? outDir : __dirname}`,
                "--password=test"].join(" "));
            // deployment.stdout.pipe(process.stdout);
            printLine("Deployment Completed");
            try{
                await waitForServer(150000, `http://localhost:${sshServer.httpPort}/get`);
            }catch (e){
                reject();
            }
            resolve();
        });
    }

    before(async function () {
        this.timeout(200000);

        sshServer2.containerName = "dind2";
        sshServer2.sshPort = 2223;
        sshServer2.httpPort = 8001;

        if(fs.existsSync(outDir)) fs.rmSync(outDir, {recursive: true});
        fs.mkdirSync(outDir);

        await Promise.all([
            setupRemoteDeployment(sshServer1),
            setupRemoteDeployment(sshServer2),
        ]);

        await fetch.post(`http://localhost:${sshServer1.httpPort}/post`);
        testArr = await fetch.get(`http://localhost:${sshServer1.httpPort}/get`);
    });

    it("Should backup / restore volume remotely", async function(){
        this.timeout(100000);

        ok(testArr.length > 0);
        const response = await fetch.get(`http://localhost:${sshServer2.httpPort}/get`);
        notDeepEqual(response, testArr);

        printLine("Backing Up");
        execSync([`node ${path.resolve(__dirname, "../../../", "cli")} backup`,
            "--host=localhost",
            `--username=${sshServer1.username}`,
            `--password=${sshServer1.password}`,
            `--ssh-port=${sshServer1.sshPort}`].join(" "));

        const backupFile = path.resolve(backupDir, "mongo-data.tar");
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 100);

        printLine("Restoring");
        execSync([`node ${path.resolve(__dirname, "../../../", "cli")} restore`,
            "--host=localhost",
            `--username=${sshServer2.username}`,
            `--password=${sshServer2.password}`,
            `--ssh-port=${sshServer2.sshPort}`].join(" "));
        await waitForServer(10000, `http://localhost:${sshServer2.httpPort}/get`);
        clearLine();

        const response2 = await fetch.get(`http://localhost:${sshServer2.httpPort}/get`)
        deepEqual(response2, testArr);
    });

    after(function(){
        cleanOutDir(outDir);
        cleanOutDir(backupDir);
        cleanOutDir(path.resolve(__dirname, "dist"));
        sshServer1.stop();
        sshServer2.stop();
    });
});
