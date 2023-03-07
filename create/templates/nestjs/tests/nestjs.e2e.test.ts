import {after, before, describe, it} from "mocha";
import TestE2E from "fullstacked/utils/testE2E";
import path, {dirname} from "path";
import {equal} from "assert";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("NestJS Template e2e Tests", function(){
    let test;
    before(async function(){
        test = new TestE2E(path.resolve(__dirname, ".."));
        await test.start("/hello-nestjs");
    });

    it('Should respond with Hello from NestJS', async function(){
        const root = await test.page.$("body");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Hello from NestJS");
    });

    after(async function(){
        await test.stop();
    });
});
