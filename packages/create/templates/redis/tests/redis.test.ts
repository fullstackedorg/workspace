import {before, after, describe, it} from "mocha";
import {equal} from "assert";
import testIntegration from "fullstacked/utils/testIntegration";

import Redis from "../server/redis";

testIntegration(describe("Redis Template Tests", function(){
    new Redis();

    before(() => Redis.connect())

    it('Should read and write', async function(){
        const key = "key"
        const value = "value"
        await Redis.client.set(key, value);
        equal(await Redis.client.get(key), value);
    });

    after(() => Redis.close())
}));
