import {describe} from "mocha";
import SSH from "../SSH";
import {exec, execSync} from "child_process";
import path from "path";
import fs from "fs";
import waitForServer from "fullstacked/scripts/waitForServer";
import {cleanOutDir, clearLine, printLine} from "../../../scripts/utils";
import {deepEqual, notDeepEqual, ok} from "assert";
import sleep from "fullstacked/scripts/sleep";
import {fetch} from "fullstacked/webapp/fetch";

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

        fs.writeFileSync(serverNameFile, JSON.stringify({"node": {"80": { server_name: "localhost" } } }));
        fs.mkdirSync(outDir);

        await Promise.all([
            setupRemoteDeployment(sshServer1),
            setupRemoteDeployment(sshServer2),
        ]);

        await fetch.post(`http://localhost:${sshServer1.httpPort}/post`);
        testArr = await fetch.get(`http://localhost:${sshServer1.httpPort}/get`);
    });

    it("Should backup / restore volume remotely", async function(){
        this.timeout(50000);

        ok(testArr.length > 0);
        notDeepEqual(await fetch.get(`http://localhost:${sshServer2.httpPort}/get`), testArr);

        printLine("Backing Up");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} backup
            --host=localhost
            --user=${sshServer1.username}
            --pass=${sshServer1.password}
            --ssh-port=${sshServer1.sshPort}
            `.replace(/\n/g, ' '));

        const backupFile = path.resolve(process.cwd(), "backup", "mongo-data.tar");
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 100);

        printLine("Restoring");
        execSync(`node ${path.resolve(__dirname, "../../../", "cli")} restore
            --host=localhost
            --user=${sshServer2.username}
            --pass=${sshServer2.password}
            --ssh-port=${sshServer2.sshPort}
            `.replace(/\n/g, ' '));
        await waitForServer(10000, `http://localhost:${sshServer2.httpPort}/get`);
        clearLine();

        deepEqual(await fetch.get(`http://localhost:${sshServer2.httpPort}/get`), testArr);
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
