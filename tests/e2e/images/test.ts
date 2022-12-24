import {describe, it, afterEach} from 'mocha';
import {ok} from "assert";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import TestE2E from "../../../utils/testE2E";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Images Format Test", function(){
    let test;

    it('Should display a JPG', async function(){
        test = new TestE2E(resolve(__dirname, "jpg"));
        await test.start();
        const root = await test.page.$("img");
        const imageSrc = await root.getProperty('src');
        ok((await imageSrc.jsonValue()).endsWith(".jpg"));
    });

    it('Should display a PNG', async function(){
        test = new TestE2E(resolve(__dirname, "png"));
        await test.start();
        const root = await test.page.$("img");
        const imageSrc = await root.getProperty('src');
        ok((await imageSrc.jsonValue()).endsWith(".png"));
    });

    it('Should display a SVG', async function(){
        test = new TestE2E(resolve(__dirname, "svg"));
        await test.start();
        const root = await test.page.$("img");
        const imageSrc = await root.getProperty('src');
        ok((await imageSrc.jsonValue()).endsWith(".svg"));
    });

    afterEach(async function(){
        await test.stop();
    });

});
