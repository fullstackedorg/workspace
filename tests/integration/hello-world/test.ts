import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import {fetch} from "../../../utils/fetch.js";
import Server from "../../../server.js";
import "./server/index.js";
import testIntegration from "../../../utils/testIntegration.js";

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
}))
