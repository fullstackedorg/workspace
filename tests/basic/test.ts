import {sleep} from "utils"
import * as assert from "assert";
import {before, describe} from "mocha";
import TestE2E from "Tests/TestE2E";

describe("Basic Test", function(){
    let test;

    before(async function (){
        test = new TestE2E(__dirname);
        await test.start()
        await sleep(1000);
    })

    it('Should load a basic web page', async function(){
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "<div>Basic Test</div>");
    });

    after(async function(){
        await test.stop();
    });
});
