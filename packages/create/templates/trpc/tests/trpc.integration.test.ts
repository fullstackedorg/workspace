import testIntegration from "fullstacked/utils/testIntegration";
import {after, before, describe, it} from "mocha";
import Server from "fullstacked/server";
import {equal} from "assert";

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/trpc.server';
import '../server/trpc.server';

testIntegration(describe("tRPC Template Integration Tests", function() {
    before(async function (){
        Server.start()
    });

    it("Should hit tRPC endpoint", async () => {
        const trpc = createTRPCProxyClient<AppRouter>({
            links: [
                httpBatchLink({
                    url: "http://localhost"
                }),
            ],
            transformer: {
                serialize: (object: any) => object,
                deserialize: (object: any) =>  object
            }
        });
        equal(await trpc.helloTRPC.query(), "Hello from tRPC");
    });

    after(async function(){
        Server.stop();
    });
}));
