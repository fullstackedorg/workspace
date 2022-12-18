import { describe, it, before, after } from 'mocha';
import HelperE2E from "../../tests/e2e/HelperE2E"
import {ok} from "assert";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import sleep from "../../utils/sleep.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("GUI Test", function(){
    let test = new HelperE2E(resolve(__dirname, ".."));

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
