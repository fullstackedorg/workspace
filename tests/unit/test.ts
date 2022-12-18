import {describe, it} from 'mocha';
import {deepEqual, equal, notEqual, ok} from "assert";
import sleep from "../../utils/sleep.js";
import waitForServer from "../../utils/waitForServer.js";
import fs from "fs";
import path, {dirname} from "path";
import {
    copyRecursiveSync,
    loadDataEncryptedWithPassword,
    randStr,
    saveDataEncryptedWithPassword
} from "../../utils/utils.js";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Unit Tests", function(){
    const oneSec = 1000;

    it('Should sleep near 1 second', async function(){
        const now = Date.now();
        await sleep(oneSec);
        ok(Date.now() - now > oneSec - 5);
    });

    it("Should error after max wait time", async function(){
        let success = false;
        let now = Date.now();
        try{
            await waitForServer(oneSec, undefined, true);
        }catch (e){
            ok(Date.now() - now > oneSec - 5);
            success = true;
        }
        ok(success);
    });

    it("Should copy recursively", function(){
        const dir = path.resolve(__dirname, "tempDir");
        fs.mkdirSync(dir);
        fs.writeFileSync(path.resolve(dir, "tempFile.txt"), "test");

        const copiedDir = path.resolve(__dirname, "tempDirCopy");
        copyRecursiveSync(dir, copiedDir);
        equal(fs.readFileSync(path.resolve(copiedDir, "tempFile.txt"), {encoding: "utf-8"}), "test");

        fs.rmSync(dir, {force: true, recursive: true});
        fs.rmSync(copiedDir, {force: true, recursive: true});
    });

    it("Should create random strings", function(){
        const str = randStr(20);
        ok(str.length === 20);
        notEqual(str, randStr(20));
    });

    it("Should encrypt/decrypt JS object with password", function (){
        const testData = {
            test: "ok"
        }
        const password = "test"
        const filePath = path.resolve(__dirname, ".fullstacked");
        saveDataEncryptedWithPassword(filePath, password, testData);
        deepEqual(loadDataEncryptedWithPassword(filePath, password), testData);

        fs.rmSync(filePath)
    });
});
