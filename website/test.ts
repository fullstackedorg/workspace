import {sleep} from "utils"
import * as assert from "assert";
import {before, describe} from "mocha";
import Helper from "tests/integration/Helper"
import axios from "axios";
import Server from "fullstacked/server";
import {registerBadgesRoutes} from "website/server/badges";

describe("Website Integration", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start()
        await sleep(2000);
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

describe("Website e2e", function(){
    let server, responseTime;

    before(async function (){
        server = new Server();
        registerBadgesRoutes(server.express);
        server.start(true);
    });

    it('Should return version badge', async function(){
        const response = await axios.get("http://localhost:8000/version/badge.svg");
        assert.ok(response.data.startsWith("<svg"));
    });

    it('Should return dependencies badge', async function(){
        const now = Date.now();
        const response = await axios.get("http://localhost:8000/dependencies/badge.svg");
        assert.ok(response.data.startsWith("<svg"));
        responseTime = Date.now() - now;
    });

    it('Should return cached badge', async function(){
        const now = Date.now();
        const response = await axios.get("http://localhost:8000/dependencies/badge.svg");
        assert.ok(response.data.startsWith("<svg"));
        assert.ok(Date.now() - now < responseTime);
    });

    it('Should return coverage badge', async function(){
        const response = await axios.get("http://localhost:8000/coverage/badge.svg");
        assert.ok(response.data.startsWith("<svg"));
    });

    after(function(){
        server.stop();
    });
});
