import {before, describe} from "mocha";
import {execSync} from "child_process";
import path from "path";
import {ok} from "assert";
import fs from "fs";

describe("Test Test", function(){
    const testDir = path.resolve(__dirname, "test");

    before(async function (){
        fs.mkdirSync(testDir);
        execSync("node " + path.resolve(__dirname, "..", "..", "..", "cli") + " create --src=" + testDir);
    });

    it('Should run default test and produce code coverage', async function(){
        this.timeout(60000);
        execSync("node " + path.resolve(__dirname, "..", "..", "..", "cli") + " test --headless --coverage --src=" + testDir + " --out=" + testDir);
        ok(fs.existsSync(path.resolve(testDir, "coverage")));
    });

    after(async function(){
        fs.rmSync(testDir, {force: true, recursive: true});
    });
});
