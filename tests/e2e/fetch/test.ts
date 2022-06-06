import {before, describe} from "mocha";
import Helper from "tests/e2e/Helper"
import {equal} from "assert";
import sleep from "fullstacked/scripts/sleep";

describe("Fetch Test", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start();

        // wait for fetch and render
        await sleep(1000)
    })

    it('Should fetch an endpoint and update frontend', async function(){
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "<div>test</div>");
    });

    after(async function(){
        await test.stop();
    });
});
