import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import Helper from "../Helper.js";
import {fetch} from "../../../webapp/fetch.js";
import Server from "../../../server/index.js";
import {dirname} from "path";
import {fileURLToPath} from "url";
import "./server/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

Helper(describe("Hello World", function(){
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
