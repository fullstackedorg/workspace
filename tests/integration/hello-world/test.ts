import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import Helper from "fullstacked/tests/integration/Helper";
import {fetch} from "fullstacked/webapp/fetch";
import Server from "fullstacked/server";
import "./server/index";

Helper(describe("Hello World", function(){
    before(function (){
        Server.start();
    });

    it('Should hit hello world endpoint', async function(){
        const response = await fetch.get("http://localhost/hello-world") ;
        equal(response, "Hello World");
    });

    after(function(){
        Server.stop();
    });
}), __dirname);
