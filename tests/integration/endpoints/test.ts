import {before, describe} from "mocha";
import Server from "fullstacked/server";
import axios from "axios";
import {equal, ok} from "assert";


describe("Endpoints Tests", function(){
    let server, responseTime;

    before(async function (){
        server = new Server();
        server.start({silent: true, testing: true});
    });

    it('Should register route and return expected data', async function(){
        const responseString = "ok";
        server.express.get("/test", (req, res) =>
            res.send(responseString));
        const response = await axios.get("/test");
        equal(response.data, responseString);
    });

    after(function(){
        server.stop();
    });

});
