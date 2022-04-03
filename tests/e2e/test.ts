import * as assert from "assert";
import {describe} from "mocha";
import Server from "fullstacked/server";
import axios from "axios";

describe("e2e Tests", function(){
    it('Should register route and return expected data', async function(){
        const server = new Server();
        const responseString = "ok";
        server.express.get("/test", (req, res) =>
            res.send(responseString));
        server.start(true);
        const response = await axios.get("http://localhost:8000/test");
        assert.equal(response.data, responseString);
        server.stop();
    });
});
