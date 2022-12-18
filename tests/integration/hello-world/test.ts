import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import {fetch} from "../../../utils/fetch.js";
import Server from "../../../server/index.js";
import {dirname} from "path";
import {fileURLToPath} from "url";
import "./server/index.js";
import testIntegration from "../../../utils/testIntegration.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

testIntegration(describe("Hello World", function(){
    before(async function (){
        Server.start();
    });

    it('Should hit hello world endpoint', async function(){
        const response = await fetch.get("http://localhost/hello-world") ;
        equal(response, "Hello World");
    });

    after(function(){
        Server.stop();
    });
}), __dirname)
