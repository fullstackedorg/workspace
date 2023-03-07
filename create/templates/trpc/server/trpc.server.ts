import {initTRPC} from '@trpc/server';
import trpcRegister from "./trpc.register";

const t = initTRPC.create();

const appRouter = t.router({
    helloTRPC: t.procedure.query(() => "Hello from tRPC"),
});

trpcRegister(appRouter);

export type AppRouter = typeof appRouter;
