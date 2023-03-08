import Server from "@fullstacked/webapp/server";
import {initTRPC} from '@trpc/server';
import { createHTTPHandler } from "@trpc/server/adapters/standalone"

const t = initTRPC.create();

const appRouter = t.router({
    helloWorld: t.procedure.query(() => "Hello World"),
});

const handler = createHTTPHandler({
    router: appRouter
});

Server.addListener("/trpc", {
    name: "tRPC",
    handler
});

export type AppRouter = typeof appRouter;
