import {before, after, it, describe} from "mocha";
import {equal} from "assert";
import Helper from "../Helper.js";
import {fetch} from "../../../utils/fetch.js";
import Server from "../../../server/index.js";
import {dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

Helper(describe("Files", function(){
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
