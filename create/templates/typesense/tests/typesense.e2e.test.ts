import {describe, it, before, after} from "mocha";
import {equal} from "assert";
import * as path from "path";
import TestE2E from "fullstacked/utils/testE2E";
import {dirname} from "path";
import {fileURLToPath} from "url";
import sleep from "fullstacked/utils/sleep";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Typesense Template e2e Tests", function(){
    let test;
    before(async function(){
        this.timeout(100000)
        test = new TestE2E(path.resolve(__dirname, ".."));
        await test.start();
    });

    function getTypesenseDIVContent(){
        return new Promise<string>(async (resolve, reject) => {
            let tries = 5;
            while(tries){
                const element = await test.page.$("#typesense");
                const innerHTML = await element.getProperty('innerHTML');
                const searchStr = await innerHTML.jsonValue();

                if(searchStr){
                    return resolve(searchStr);
                }

                await test.page.reload({waitUntil: ["load"]});
                await sleep(2000);
                tries--;
            }

            reject(new Error("Cannot get Typesense DIV"));
        })
    }

    it('Should get hello from Typesense', async function(){
        equal(await getTypesenseDIVContent(), "Hello from Typesense");
    });

    after(function(){
        test.stop();
    });
});
