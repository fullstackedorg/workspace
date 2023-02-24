import {describe, it, before, after} from 'mocha';
import SSH from "../SSH";
import {exec, execSync} from "child_process";
import path, {dirname} from "path";
import fs from "fs";
import waitForServer from "../../../utils/waitForServer";
import {cleanOutDir, clearLine, printLine, saveDataEncryptedWithPassword} from "../../../utils/utils";
import {deepEqual, notDeepEqual, ok} from "assert";
import {fetch} from "../../../utils/fetch";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Backup-Restore Remotely Test", function(){
    const sshServers = new SSH();
    const backupDir = path.resolve(process.cwd(), "backup");
    const outDir = path.resolve(__dirname, "out");
    let testArr = [];

    async function setupRemoteDeployment(index){
        saveDataEncryptedWithPassword(path.resolve(__dirname, ".fullstacked"), "test", {
            sshCredentials: {
                host: "localhost",
                port: sshServers.containers.at(index).sshPort,
                username: sshServers.username,
                password: sshServers.password,
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
            `--out=${index ? __dirname : outDir}`,
            "--password=test"].join(" "));
        deployment.stdout.pipe(process.stdout);
        deployment.stderr.pipe(process.stderr);

        await waitForServer(50000, `http://localhost:${sshServers.containers.at(index).httpPort}/get`);
        printLine("Deployment Completed");
    }

    before(async function () {
        this.timeout(2000000);

        if(fs.existsSync(outDir)) fs.rmSync(outDir, {recursive: true});
        fs.mkdirSync(outDir);

        await sshServers.init(2, ["node:18-alpine", "redis:latest", "nginx:latest"]);
        await setupRemoteDeployment(0);
        await setupRemoteDeployment(1);

        await fetch.post(`http://localhost:${sshServers.containers.at(0).httpPort}/post`);
        testArr = await fetch.get(`http://localhost:${sshServers.containers.at(0).httpPort}/get`);
    });

    it("Should backup / restore volume remotely", async function(){
        this.timeout(2000000);

        ok(testArr.length > 0);
        const response = await fetch.get(`http://localhost:${sshServers.containers.at(1).httpPort}/get`);
        notDeepEqual(response, testArr);

        printLine("Backing Up");
        execSync([`node ${path.resolve(__dirname, "../../../", "cli")} backup`,
            "--host=localhost",
            `--username=${sshServers.username}`,
            `--password=${sshServers.password}`,
            `--ssh-port=${sshServers.containers.at(0).sshPort}`].join(" "), {stdio: "inherit"});

        const backupFile = path.resolve(backupDir, "redis-data.tar");
        ok(fs.existsSync(backupFile));
        ok(fs.statSync(backupFile).size > 100);

        printLine("Restoring");
        execSync([`node ${path.resolve(__dirname, "../../../", "cli")} restore`,
            "--host=localhost",
            `--username=${sshServers.username}`,
            `--password=${sshServers.password}`,
            `--ssh-port=${sshServers.containers.at(1).sshPort}`].join(" "), {stdio: "inherit"});
        await waitForServer(10000, `http://localhost:${sshServers.containers.at(1).httpPort}/get`);
        clearLine();

        const response2 = await fetch.get(`http://localhost:${sshServers.containers.at(1).httpPort}/get`)
        deepEqual(response2, testArr);
    });

    after(function(){
        cleanOutDir(outDir);
        cleanOutDir(backupDir);
        cleanOutDir(path.resolve(__dirname, "dist"));
        sshServers.stop();
    });
});
