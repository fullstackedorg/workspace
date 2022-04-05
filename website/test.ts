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
    });

    it('Should load Home and display quote', async function(){
        const root = await test.page.$("#quote");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "The only tool you need to build webapps in TypeScript.");
    });

    async function getDocsTitle(){
        const title = await test.page.$("h1");
        const innerHTML = await title.getProperty('innerHTML');
        return await innerHTML.jsonValue()
    }

    it('Should display docs and navigate pages', async function(){
        await test.page.setViewport({ width: 1366, height: 768});
        await test.page.goto("http://localhost:8000/docs");
        const docPagesCount = (await test.page.$$("#docs-navigation a")).length;
        for (let i = 0; i < docPagesCount; i++) {
            const docPages = await test.page.$$("#docs-navigation a");
            await docPages[i].click();
            const innerHTML = await docPages[i].getProperty('innerHTML');
            const pageTitle = await innerHTML.jsonValue();
            assert.equal(await getDocsTitle(), pageTitle);
        }
    });

    after(async function(){
        await test.stop();
    });
});
