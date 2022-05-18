import {before, describe} from "mocha";
import Server from "fullstacked/server";
import axios from "axios";
import {equal, ok} from "assert";
import Helper from "fullstacked/tests/e2e/Helper";


describe("Images Format Tests", function(){
    const format = ["jpg", "png", "svg"];
    let testCount = 0, test;

    beforeEach(async function (){
        test = new Helper(__dirname + "/" + format[testCount]);
        await test.start();
        testCount++;
    });

    it('Should display a JPG', async function(){
        const root = await test.page.$("img");
        const imageSrc = await root.getProperty('src');
        ok((await imageSrc.jsonValue()).endsWith(".jpg"));
    });

    it('Should display a PNG', async function(){
        const root = await test.page.$("img");
        const imageSrc = await root.getProperty('src');
        ok((await imageSrc.jsonValue()).endsWith(".png"));
    });

    it('Should display a SVG', async function(){
        const root = await test.page.$("img");
        const imageSrc = await root.getProperty('src');
        ok((await imageSrc.jsonValue()).endsWith(".svg"));
    });

    afterEach(async function(){
        await test.stop();
    });

});
