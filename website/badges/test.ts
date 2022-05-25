import {before, describe} from "mocha";
import server from "website/server";
import axios from "axios";
import {equal, ok} from "assert";
import {badgeColor} from "./badges";
import postbuild from "../postbuild";
import fs from "fs";
import {getPackageJSON} from "../../scripts/utils";


describe("Website Integration Badges Tests", function(){
    before(async function (){
        server.start({silent: true, testing: true});
    });

    it('Should return version badge', async function(){
        const response = await axios.get("/badges/version.svg");
        ok(response.data.startsWith("<svg"));
    });

    it('Should respond with dependencies badge then cached badge', async function(){
        postbuild({
            out: __dirname
        });

        const now = Date.now();

        const response1 = await axios.get("/badges/dependencies.svg");
        ok(response1.data.startsWith("<svg"));
        const responseTime1 = Date.now() - now;

        const now2 = Date.now();
        const response2 = await axios.get("/badges/dependencies.svg");
        equal(response2.data, response1.data);
        ok(Date.now() - now2 < responseTime1);
    });

    it('Should respond with badge dependencies all', async function(){
        const packageJSON = getPackageJSON();
        fs.writeFileSync(__dirname + "/dependencies.json", JSON.stringify({
            express: packageJSON.dependencies.express
        }));
        const response = await axios.get("/badges/dependencies/all.svg");
        ok(response.data.startsWith("<svg"));
    });

    it('Should return coverage badge', async function(){
        const response = await axios.get("/badges/coverage.svg");
        ok(response.data.startsWith("<svg"));
    });

    after(function(){
        fs.rmSync(__dirname + "/dependencies.json", {force: true});
        server.stop();
    });
});

describe("Website Badges Unit Tests", function(){
    it('Should return right color with less than', function(){
        const ranges: [number, number, number, number] = [5, 10, 15, 20];
        equal(badgeColor(0, ranges, "<"), "brightgreen");
        equal(badgeColor(5, ranges, "<"), "green");
        equal(badgeColor(10, ranges, "<"), "yellowgreen");
        equal(badgeColor(15, ranges, "<"), "yellow");
        equal(badgeColor(20, ranges, "<"), "red");
    });

    it('Should return right color with greater than', function(){
        const ranges: [number, number, number, number] = [20, 15, 10, 5];
        equal(badgeColor(0, ranges, ">"), "red");
        equal(badgeColor(6, ranges, ">"), "yellow");
        equal(badgeColor(11, ranges, ">"), "yellowgreen");
        equal(badgeColor(16, ranges, ">"), "green");
        equal(badgeColor(21, ranges, ">"), "brightgreen");
    });
});

