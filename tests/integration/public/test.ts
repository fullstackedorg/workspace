import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import {fetch} from "../../../utils/fetch.js";
import Server from "../../../server.js";
import {dirname} from "path";
import {fileURLToPath} from "url";
import testIntegration from "../../../utils/testIntegration.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

testIntegration(describe("Files", function(){
    before(function (){
        Server.publicDir = __dirname
        Server.start();
    });

    it('Should hit file in public directory', async function(){
        const response = await fetch.get("http://localhost/") ;
        equal(response.trim(), "File Test");
    });

    after(function(){
        Server.stop();
    });
}), __dirname);
