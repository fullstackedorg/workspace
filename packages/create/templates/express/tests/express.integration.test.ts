import testIntegration from "fullstacked/utils/testIntegration";
import {after, before, describe, it} from "mocha";
import Server from "fullstacked/server";
import {equal} from "assert";
import {fetch} from "fullstacked/utils/fetch";

import "../server/express.server";

testIntegration(describe("Express Template Integration Tests", function() {
    before(async function (){
        Server.start()
    });

    it("Should hit /hello-express endpoint", async () => {
        equal(await fetch.get("http://localhost/hello-express"), "Hello from express");
    });

    after(async function(){
        Server.stop();
    });
}));
