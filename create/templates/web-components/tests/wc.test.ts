import {describe, it, before, after} from "mocha";
import {equal} from "assert";
import * as path from "path";
import TestE2E from "fullstacked/utils/testE2E";
import {dirname} from "path";
import {fileURLToPath} from "url";
import FullStackedVersion from "fullstacked/version";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Web Components Template Tests", function(){
    let test;
    before(async function(){
        test = new TestE2E(path.resolve(__dirname, ".."));
        await test.start();
    });

    it('Should display FullStacked Version', async function(){
        const root = await test.page.$("#version");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, FullStackedVersion);
    });

    after(async function(){
        await test.stop();
    });
});
