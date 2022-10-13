import "../../../scripts/register";
import { describe, it, before, after } from 'node:test';
import Helper from "fullstacked/tests/e2e/Helper"
import {equal} from "assert";

describe("Basic Test", function(){
    let test = new Helper(__dirname);

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
