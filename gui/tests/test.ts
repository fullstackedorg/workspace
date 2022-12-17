import { describe, it, before, after } from 'mocha';
import Helper from "../../tests/e2e/Helper.js"
import {ok} from "assert";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import sleep from "../../utils/sleep.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("GUI Test", function(){
    let test = new Helper(resolve(__dirname, ".."));

    before(async function (){
        await test.start();
    });

    it('Should load a basic web page', async function(){
        await sleep(1000);
        const root = await test.page.$("h1");
        const innerHTML = await root.getProperty('innerHTML');
        const value: string = await innerHTML.jsonValue();
        ok(value.includes("FullStacked GUI"));
    });

    after(async function(){
        await test.stop();
    });
});
