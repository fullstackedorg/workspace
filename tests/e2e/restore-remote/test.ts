import {describe} from "mocha";
import SSH from "../SSH";
import {exec, execSync} from "child_process";
import path from "path";
import fs from "fs";
import waitForServer from "fullstacked/scripts/waitForServer";
import axios from "axios";
import {cleanOutDir, clearLine, printLine} from "../../../scripts/utils";
import {deepEqual, notDeepEqual, ok} from "assert";
import sleep from "fullstacked/scripts/sleep";

describe("Backup-Restore Remotely Test", function(){
    const sshServer1 = new SSH();
    const sshServer2 = new SSH();
    const serverNameFile = path.resolve(__dirname, ".server-names");
    const outDir = path.resolve(__dirname, "out");
    let testArr = [];

    function setupRemoteDeployment(sshServer: SSH){
        return new Promise<void>(async (resolve, reject) => {
            if(sshServer === sshServer2)
                await sleep(2000);

            sshServer.init();
            exec(`node ${path.resolve(__dirname, "../../../", "cli")} deploy
                --src=${__dirname}
                --out=${sshServer === sshServer1 ? outDir : __dirname}
                --y
                --skip-test
                --host=localhost
                --user=${sshServer.username}
                --pass=${sshServer.password}
                --ssh-port=${sshServer.sshPort}
                `.replace(/\n/g, ' '));
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
        sshServer2.httpsPort = 8444;

        fs.writeFileSync(serverNameFile, JSON.stringify({"node": "localhost"}));
        fs.mkdirSync(outDir);

        await Promise.all([
            setupRemoteDeployment(sshServer1),
            setupRemoteDeployment(sshServer2),
        ]);

        await axios.post(`http://localhost:${sshServer1.httpPort}/post`);
        testArr = (await axios.get(`http://localhost:${sshServer1.httpPort}/get`)).data;
    });

    it("Should backup / restore volume remotely", async function(){
        this.timeout(50000);

        ok(testArr.length > 0);
        notDeepEqual(testArr, (await axios.get(`http://localhost:${sshServer2.httpPort}/get`)).data)

        printLine("Backing Up");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup
            --backup-dir=${__dirname}
            --volume=mongo-data
            --host=localhost
            --user=${sshServer1.username}
            --pass=${sshServer1.password}
            --ssh-port=${sshServer1.sshPort}
            `.replace(/\n/g, ' '));

        const backupFile = path.resolve(__dirname, "backup", "mongo-data.tar");
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 100);

        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore
            --backup-dir=${__dirname}
            --volume=mongo-data
            --host=localhost
            --user=${sshServer2.username}
            --pass=${sshServer2.password}
            --ssh-port=${sshServer2.sshPort}
            `.replace(/\n/g, ' '));
        await waitForServer(10000, `http://localhost:${sshServer2.httpPort}/get`);
        clearLine();

        deepEqual((await axios.get(`http://localhost:${sshServer2.httpPort}/get`)).data, testArr);
    });

    after(function(){
        fs.rmSync(serverNameFile);
        cleanOutDir(outDir);
        cleanOutDir(path.resolve(__dirname, "backup"));
        cleanOutDir(path.resolve(__dirname, "dist"));
        sshServer1.stop();
        sshServer2.stop();
    });
});
