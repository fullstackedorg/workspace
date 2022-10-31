import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import Helper from "fullstacked/tests/integration/Helper";
import server from "./server/index";
import {fetch} from "../../../webapp/fetch"

Helper(describe("Hello World", function(){
    before(async function (){
        server.start({silent: true, testing: true})
    });

    it('Should hit hello world endpoint', async function(){
        const response = await fetch.get("http://localhost/hello-world") ;
        equal(response, "Hello World");
    });

    after(async function(){
        server.stop();
    });
}), __dirname);
