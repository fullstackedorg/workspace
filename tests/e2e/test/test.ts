import {before, after, describe, it} from "mocha";
import {execSync} from "child_process";
import path, {dirname} from "path";
import {ok} from "assert";
import fs from "fs";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Test Test", function(){
    const testDir = path.resolve(__dirname, "app");
    const testFile = path.resolve(testDir, "test.ts");

    before(async function (){
        if(fs.existsSync(testDir)) fs.rmSync(testDir, {force: true, recursive: true})
        fs.mkdirSync(testDir);
        fs.copyFileSync(path.resolve(__dirname, "test-template.ts"), testFile);
    });

    it('Should run default test and produce code coverage', async function(){
        execSync("node " + path.resolve(__dirname, "..", "..", "..", "cli") + " test --headless --coverage --src=" + testDir + " --out=" + testDir);
        // ok(fs.existsSync(path.resolve(testDir, "coverage")));
    });

    after(async function(){
        fs.rmSync(testDir, {force: true, recursive: true});
    });
});
