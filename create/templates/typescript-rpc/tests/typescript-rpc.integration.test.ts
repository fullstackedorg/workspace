import testIntegration from "fullstacked/utils/testIntegration";
import {after, before, describe, it} from "mocha";
import Server from "fullstacked/server";
import {equal} from "assert";
import createClient from "typescript-rpc/createClient";
import api from "../server/typescript-rpc.server";

import "../server/typescript-rpc.server";

testIntegration(describe("typescript-rpc Template Integration Tests", function() {
    let client;
    before(async function (){
        Server.start();
        client = createClient<typeof api>("http://localhost");
        await client.ready();
    });

    it("Should get Hello World", async () => {
        equal(await client.hello(), "Hello from typescript-rpc");
    });

    after(async function(){
        Server.stop();
    });
}));
