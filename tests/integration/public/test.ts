import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import Helper from "fullstacked/tests/integration/Helper";
import server from "./server/index";
import {fetch} from "fullstacked/webapp/fetch";

Helper(describe("Files", function(){
    before(async function (){
        server.publicDir = __dirname;
        server.start({silent: true, testing: true});
    });

    it('Should hit file in public directory', async function(){
        const response = await fetch.get("http://localhost/") ;
        equal(response.trim(), "File Test");
    });

    after(async function(){
        server.stop();
    });
}), __dirname);
