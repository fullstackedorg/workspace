import { describe, it, before, after } from 'mocha';
import {equal} from "assert";
import {dirname} from "path";
import {fileURLToPath} from "url";
import TestE2E from "../../../utils/testE2E";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Default Test", function(){
    let test = new TestE2E(__dirname);

    before(async function (){
        await test.start();
    });

    it('Should display main title', async function(){
        const root = await test.page.$("h1");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Welcome to FullStacked");
    });

    after(async function(){
        await test.stop();
    });
});
