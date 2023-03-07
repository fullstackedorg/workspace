import testIntegration from "fullstacked/utils/testIntegration";
import {after, before, describe, it} from "mocha";
import Server from "fullstacked/server";
import {equal} from "assert";
import Typesense from "typesense";

import '../server/typesense.server';
import {testCollection} from "../server/typesense.values";
import sleep from "fullstacked/utils/sleep";

testIntegration(describe("Typesense Template Integration Tests", function() {
    before(async function (){
        this.timeout(5000);

        Server.start();

        await sleep(3000);
    });

    it("Should hit Typesense server endpoint", async () => {
        const typesense = new Typesense.Client({
            nodes: [{
                host: "localhost",
                path: "/search",
                port: 80,
                protocol: "http"
            }],
            apiKey: 'xyz',
            numRetries: 3,
            connectionTimeoutSeconds: 10,
            retryIntervalSeconds: 2,
            healthcheckIntervalSeconds: 2,
            logLevel: 'silent'
        });
        const result = await typesense.collections<{ searchStr: string }>(testCollection).documents().search({
            q: "Hel",
            query_by: "searchStr"
        })
        const searchStr = result?.hits?.at(0)?.document?.searchStr;
        equal(searchStr, "Hello from Typesense");
    });

    after(async function(){
        Server.stop();
    });
}));
