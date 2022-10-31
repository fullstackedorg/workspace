import {before, after, describe, it} from "mocha";
import {execSync} from "child_process";
import path from "path";
import {ok} from "assert";
import fs from "fs";
import {copyRecursiveSync} from "../../../scripts/utils";

describe("Test Test", function(){
    const testDir = path.resolve(__dirname, "app");
    const testFile = path.resolve(testDir, "test.ts");

    before(async function (){
        fs.mkdirSync(testDir);
        copyRecursiveSync(path.resolve(__dirname, "app-template"), testDir);
        fs.copyFileSync(path.resolve(__dirname, "test-template.ts"), testFile);
    });

    it('Should run default test and produce code coverage', async function(){
        execSync("node " + path.resolve(__dirname, "..", "..", "..", "cli") + " test --headless --coverage --src=" + testDir + " --out=" + testDir);
        ok(fs.existsSync(path.resolve(testDir, "coverage")));
    });

    after(async function(){
        fs.rmSync(testDir, {force: true, recursive: true});
    });
});
