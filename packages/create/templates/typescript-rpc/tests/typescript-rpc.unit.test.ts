import {describe, it} from "mocha";
import api from "../server/typescript-rpc.server";
import {equal} from "assert";

describe("typescript-rpc Template Unit Tests", function(){
    it("Should return Hello World", async function (){
        equal(await api.hello(), "Hello from typescript-rpc");
    });
});
