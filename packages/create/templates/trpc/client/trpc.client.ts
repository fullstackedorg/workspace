import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/trpc.server';

const trpc = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({
            url: window.location.origin + "/trpc"
        }),
    ],
    transformer: {
        serialize: (object: any) => object,
        deserialize: (object: any) => object
    }
});

const trpcDIV = document.createElement("div");
trpcDIV.setAttribute("id", "trpc-root")
document.body.append(trpcDIV);

trpcDIV.innerHTML = await trpc.helloWorld.query();

