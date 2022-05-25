import {before, describe} from "mocha";
import axios from "axios";
import {equal, ok} from "assert";
import path from "path";
import fs from "fs";
import server from "./server";


describe("Assets Tests", function(){
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
        fs.rmSync(path.resolve(__dirname, "dist"), {force: true, recursive: true});
    });

});
