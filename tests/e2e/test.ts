import * as assert from "assert";
import {before, describe} from "mocha";
import Server from "fullstacked/server";
import axios from "axios";

describe("e2e Tests", function(){
    let server, responseTime;

    before(async function (){
        server = new Server();
        server.start({silent: true, testing: true});
    });

    it('Should register route and return expected data', async function(){
        const responseString = "ok";
        server.express.get("/test", (req, res) =>
            res.send(responseString));
        const response = await axios.get("http://localhost:8000/test");
        assert.equal(response.data, responseString);
    });

    it('Should return version badge', async function(){
        const response = await axios.get("http://localhost:8000/badges/version.svg");
        assert.ok(response.data.startsWith("<svg"));
    });

    it('Should return dependencies badge', async function(){
        const now = Date.now();
        const response = await axios.get("http://localhost:8000/badges/dependencies.svg");
        assert.ok(response.data.startsWith("<svg"));
        responseTime = Date.now() - now;
    });

    it('Should return cached badge', async function(){
        const now = Date.now();
        const response = await axios.get("http://localhost:8000/badges/dependencies.svg");
        assert.ok(response.data.startsWith("<svg"));
        assert.ok(Date.now() - now < responseTime);
    });

    it('Should return coverage badge', async function(){
        const response = await axios.get("http://localhost:8000/badges/coverage.svg");
        assert.ok(response.data.startsWith("<svg"));
    });

    after(function(){
        server.stop();
    });

});
