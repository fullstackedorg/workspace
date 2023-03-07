import {describe, it, before, after} from "mocha";
import {ok} from "assert";
import * as path from "path";
import TestE2E from "fullstacked/utils/testE2E";
import {dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("WordPress Template Tests", function(){
    let test;
    before(async function(){
        test = new TestE2E(path.resolve(__dirname, ".."));
        await test.start();
    });

    it('Should get wordpress license', async function(){
        await test.page.goto(`http://wp.localhost:${test.runCommand.runner.nodePort}/license.txt`);
        const root = await test.page.$("pre");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        ok(value.startsWith("WordPress - Web publishing software"));
    });

    after(async function(){
        await test.stop();
    });
});
