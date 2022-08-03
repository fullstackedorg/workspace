import {before, describe} from "mocha";
import {equal} from "assert";
import Helper from "fullstacked/tests/integration/Helper";
import server from "./server";
import {fetch} from "fullstacked/fetch";

Helper(describe("Hello World", function(){
    before(async function (){
        server.start({silent: true, testing: true})
    });

    it('Should hit hello world endpoint', async function(){
        const response = await fetch.get("/hello-world");
        equal(response, "Hello World");
    });

    after(async function(){
        server.stop();
    });
}), __dirname);
