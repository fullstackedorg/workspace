import {before, describe} from "mocha";
import axios from "axios";
import {equal} from "assert";
import path from "path";
import server from "../server";
import Helper from "../Helper";


describe("Assets Tests", function(){
    const test = new Helper(path.resolve(__dirname, "../"));

    before(async function (){
        await test.start();
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
        test.stop();
    });

});
