import {before, describe} from "mocha";
import Helper from "tests/e2e/Helper"
import {glob} from "glob";
import * as path from "path";
import {equal, ok} from "assert";

describe("Code Splitting", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start();
    })

    it('Should lazy load the component', async function(){
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "<div>Lazy Loaded</div>");
    });

    it('Should have more than 1 js file in public', async function(){
        const jsFiles = glob.sync("**/public/*.js", {cwd: path.resolve(__dirname.replace("/.tests", ""), "dist")});
        ok(jsFiles.length > 1);
    });

    after(async function(){
        await test.stop();
    });
});
