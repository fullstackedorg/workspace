import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import Helper from "fullstacked/tests/integration/Helper";
import {fetch} from "fullstacked/webapp/fetch";
import Server from "fullstacked/server";

Helper(describe("Files", function(){
    before(async function (){
        Server.publicDir = __dirname
        Server.start();
    });

    it('Should hit file in public directory', async function(){
        const response = await fetch.get("http://localhost/") ;
        equal(response.trim(), "File Test");
    });

    after(async function(){
        Server.stop();
    });
}), __dirname);
