import {describe, it, before, after} from "mocha";
import * as path from "path";
import {ok} from "assert";
import TestE2E from "fullstacked/utils/testE2E";
import {dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("PWA Template Tests", function(){
    let test;
    before(async function(){
        test = new TestE2E(path.resolve(__dirname, ".."));
        await test.start();
    });

    it('Should request manifest and service-worker in index head', async function(){
        const root = await test.page.$("head");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        ok(value.includes("<link rel=\"manifest\" href=\"/manifest.json\">"))
        ok(value.includes("<script type=\"module\" src=\"/service-worker.js\"></script>"))
    });

    it('Should get the manifest', async function(){
        await test.goto("/manifest.json");
        const root = await test.page.$("pre");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        const json = JSON.parse(value);
        ok(json.name);
        ok(json.display);
        ok(json.start_url);
    });

    it('Should get the service-worker', async function(){
        await test.goto("/service-worker.js");
        const root = await test.page.$("body");
        ok(root);
    });

    after(function(){
        test.stop();
    });
});
