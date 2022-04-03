import {sleep} from "utils"
import * as assert from "assert";
import {before, describe} from "mocha";
import Helper from "tests/integration/Helper"

describe("Website", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start()
        await sleep(1000);
    })

    it('Should load Home and display quote', async function(){
        const root = await test.page.$("#quote");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "The only tool you need to build webapps in TypeScript.");
    });

    after(async function(){
        await test.stop();
    });
});
