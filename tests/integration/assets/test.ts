import {before, describe} from "mocha";
import {equal} from "assert";
import Helper from "fullstacked/tests/integration/Helper";
import server from "./server/index";
import path from "path";
import axios from "axios";

Helper(describe("Assets Tests", function(){
    before(async function (){
        server.start({silent: true, testing: true});
        server.assetsDir = path.resolve(__dirname);
    });

    it('Should output image in asset folder and respond with JPG image', async function(){
        const response = await axios.get("/assets/logo.jpg");
        equal(response.status, 200);
        equal(response.headers["content-type"], "image/jpeg");
    });

    after(function(){
        server.stop();
    });
}), __dirname)

