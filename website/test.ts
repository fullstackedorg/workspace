import * as assert from "assert";
import {before, describe} from "mocha";
import Helper from "tests/e2e/Helper"
import {equal, ok} from "assert";
import sleep from "fullstacked/scripts/sleep";

describe("Website End-2-End", function(){
    let test;

    before(async function (){
        this.timeout(30000);
        test = new Helper(__dirname);
        await test.start();
    });

    it('Should load Home and display quote', async function(){
        const root = await test.page.$("#quote");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "The only tool you need to build web apps in TypeScript.");
    });

    async function getDocsTitle(){
        const title = await test.page.$("h1");
        const innerHTML = await title.getProperty('innerHTML');
        return await innerHTML.jsonValue()
    }

    it('Should display docs and navigate pages', async function(){
        await test.page.setViewport({ width: 1366, height: 768});
        await test.page.goto("http://localhost:8000/docs");
        await sleep(500);
        const docPagesCount = (await test.page.$$("#docs-navigation > div > div > a")).length;
        for (let i = 0; i < docPagesCount; i++) {
            const docPages = await test.page.$$("#docs-navigation > div > div > a");
            await docPages[i].click();
            await sleep(200);
            const innerHTML = await docPages[i].getProperty('innerHTML');
            const pageTitle = await innerHTML.jsonValue();
            assert.equal(await getDocsTitle(), pageTitle);
        }
    });

    async function getSubscribersCount(){
        await test.page.goto("http://localhost:8000/mailing/subscribers");
        const body = await test.page.$("body > pre");
        const innerHTML = await body.getProperty('innerHTML');
        return parseInt(await innerHTML.jsonValue());
    }

    it('Should subscribe to mailing list', async function(){
        const subscribersCountBefore = await getSubscribersCount();
        ok(!isNaN(subscribersCountBefore));
        ok(subscribersCountBefore);

        await test.page.goto("http://localhost:8000/");
        const inputEmail = await test.page.$('#email');
        await inputEmail.type("hi@cplepage.com");

        const inputName = await test.page.$('#name');
        await inputName.type("cplepage");
        await inputName.press('Enter');

        await sleep(2000);

        const successMsgContainer = await test.page.$("#success-msg");
        const successMsg = await successMsgContainer.getProperty('innerHTML');
        equal(await successMsg.jsonValue(), "Thanks for subscribing!");

        const subscribersCountAfter = await getSubscribersCount();
        ok(!isNaN(subscribersCountAfter));
        ok(subscribersCountAfter > subscribersCountBefore);
    });

    after(async function(){
        await test.stop();
    });
});
