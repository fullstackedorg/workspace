import {sleep} from "utils"
import * as assert from "assert";
import {before, describe} from "mocha";
import TestE2E from "Tests/TestE2E";

describe("Fetch Test", function(){
    let test;

    before(async function (){
        test = new TestE2E(__dirname);
        await test.start()
        await sleep(2000);
    })

    it('Should fetch an endpoint and update frontend', async function(){
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "<div>test</div>");
    });

    after(async function(){
        await test.stop();
    });
});