import {sleep} from "utils"
import * as assert from "assert";
import {describe} from "mocha";

describe("Unit Tests", function(){
    it('Should sleep near 1 second', async function(){
        const now = Date.now();
        const oneSec = 1000;
        await sleep(oneSec);
        assert.ok(Date.now() - now > oneSec - 5);
    });
});
