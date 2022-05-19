import {before, describe} from "mocha";
import server from "website/server";
import axios from "axios";
import {ok} from "assert";


describe("Badges Tests", function(){
    let responseTime;

    before(async function (){
        server.start({silent: true, testing: true});
    });

    it('Should return version badge', async function(){
        const response = await axios.get("/badges/version.svg");
        ok(response.data.startsWith("<svg"));
    });

    it('Should return dependencies badge', async function(){
        const now = Date.now();
        const response = await axios.get("/badges/dependencies.svg");
        ok(response.data.startsWith("<svg"));
        responseTime = Date.now() - now;
    });

    it('Should return cached badge', async function(){
        const now = Date.now();
        const response = await axios.get("/badges/dependencies.svg");
        ok(response.data.startsWith("<svg"));
        ok(Date.now() - now < responseTime);
    });

    it('Should return coverage badge', async function(){
        const response = await axios.get("/badges/coverage.svg");
        ok(response.data.startsWith("<svg"));
    });

    after(function(){
        server.stop();
    });

});
