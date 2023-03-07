import testIntegration from "fullstacked/utils/testIntegration";
import {after, before, describe, it} from "mocha";
import Server from "fullstacked/server";
import {equal, ok} from "assert";
import {fetch} from "fullstacked/utils/fetch";

import "../server/nestjs.server";

testIntegration(describe("NestJS Template Integration Tests", function() {
    before(async function (){
        Server.start()
    });

    it("Should hit /hello-nestjs endpoint", async () => {
        equal(await fetch.get("http://localhost/hello-nestjs"), "Hello from NestJS");
    });

    it("Should error at /hello-nestjs/error endpoint", async () => {
        let errored = false;
        try{
            await fetch.get("http://localhost/hello-nestjs/error")
        }catch (e){
            errored = true
        }
        ok(errored);
    });

    it("Should pass through nestjs", async () => {
        Server.listeners.push({
            handler(req, res) {
                res.writeHead(200);
                res.end("1");
            }
        });
        ok(await fetch.get("http://localhost/"));
    });

    after(async function(){
        Server.stop();
    });
}));
