import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/trpc.server';

const trpc = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({
            url: window.location.origin
        }),
    ],
    transformer: {
        serialize: (object: any) => object,
        deserialize: (object: any) => object
    }
});

async function helloFromTRPC(){
    const trpcDIV = document.createElement("div");
    trpcDIV.setAttribute("id", "hello-from-trpc")
    document.body.append(trpcDIV);

    trpcDIV.innerHTML = await trpc.helloTRPC.query();
}

helloFromTRPC();
