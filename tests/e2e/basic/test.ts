import { describe, it, before, after } from 'mocha';
import {equal} from "assert";
import {dirname} from "path";
import {fileURLToPath} from "url";
import TestE2E from "../../../utils/testE2E.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Basic Test", function(){
    let test = new TestE2E(__dirname);

    before(async function (){
        await test.start();
    });

    it('Should load a basic web page', async function(){
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value: string = await innerHTML.jsonValue();
        equal(value.trim(), "<basic-test>Basic Test</basic-test>");
    });

    after(async function(){
        await test.stop();
    });
});
