import {describe, it, before, after} from "mocha";
import {equal} from "assert";
import * as path from "path";
import TestE2E from "fullstacked/utils/testE2E";
import {dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("tRPC Template e2e Tests", function(){
    let test;
    before(async function(){
        test = new TestE2E(path.resolve(__dirname, ".."));
        await test.start();
    });

    it('Should get hello from tRPC', async function(){
        const root = await test.page.$("#hello-from-trpc");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Hello from tRPC");
    });

    after(function(){
        test.stop();
    });
});
