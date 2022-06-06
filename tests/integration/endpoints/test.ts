import {before, describe} from "mocha";
import server from "../server"
import axios from "axios";
import {equal, ok} from "assert";
import path from "path";
import Helper from "fullstacked/tests/integration/Helper";


describe("Endpoints Tests", function(){
    const test = new Helper(path.resolve(__dirname, "../"));

    before(async function (){
        await test.start();
        server.start({silent: true, testing: true});
    });

    it('Should register route and respond expected data', async function(){
        const responseString = "ok";
        server.express.get("/test", (req, res) =>
            res.send(responseString));
        const response = await axios.get("/test");
        equal(response.data, responseString);
    });

    after(function(){
        server.stop();
        test.stop();
    });

});
