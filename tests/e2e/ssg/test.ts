import * as assert from "assert";
import {before, describe} from "mocha";
import Helper from "fullstacked/tests/e2e/Helper";

describe("End-2-End", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start();
    });

    it('Should load html file and find title', async function(){
        const root = await test.page.$("h1");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "Welcome to FullStacked!");
    });

    after(async function(){
        await test.stop();
    });
});
