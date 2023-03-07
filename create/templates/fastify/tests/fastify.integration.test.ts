import testIntegration from "fullstacked/utils/testIntegration";
import {before, after, describe, it} from "mocha";
import Server from "fullstacked/server";
import {equal, ok} from "assert";
import {fetch} from "fullstacked/utils/fetch";

import "../server/fastify.server";

testIntegration(describe("Fastify Template Integration Tests", function() {
    before(() => {
        Server.start();
    });

    it("Should hit /hello-fastify endpoint", async () => {
        equal(await fetch.get("http://localhost/hello-fastify"), "Hello from Fastify");
    });

    it("Should pass through", async () => {
        let failed = false;
        try{
            await fetch.get("http://localhost/hello-not-found")
        }catch (e){
            failed = true;
        }
        ok(failed);
    });

    after(() => {
        Server.stop()
    });
}));
