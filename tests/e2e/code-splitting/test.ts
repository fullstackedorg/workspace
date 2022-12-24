import {before, describe, it, after} from 'mocha';
import glob from "glob";
import * as path from "path";
import {equal, ok} from "assert";
import sleep from "../../../utils/sleep";
import {dirname} from "path";
import {fileURLToPath} from "url";
import TestE2E from "../../../utils/testE2E";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Code Splitting", function(){
    let test: TestE2E;

    before(async function (){
        test = new TestE2E(__dirname);
        await test.start();
    })

    it('Should lazy load the component', async function(){
        await sleep(500);
        const root = await test.page.$("lazy-loaded");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Lazy Loaded");
    });

    it('Should have more than 1 js file in public', async function(){
        const jsFiles = glob.sync("**/public/*.js", {cwd: path.resolve(__dirname.replace("/.tests", ""), "dist")});
        ok(jsFiles.length > 1);
    });

    after(async function(){
        await test.stop();
    });
});
