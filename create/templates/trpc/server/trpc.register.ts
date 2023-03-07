import { createHTTPHandler } from "@trpc/server/adapters/standalone"
import Server from "fullstacked/server";

export default function (appRouter){
    const httpHandler = createHTTPHandler({
        router: appRouter
    });

    const {handler, resolver} = Server.promisify((req, res) => {
        const headerMap = new Map();
        const setHeader = res.setHeader.bind(res);
        const end = res.end.bind(res);

        return httpHandler(req, {
            ...res,
            setHeader: (key, value) => {
                headerMap.set(key, value);
            },
            end: rawBody => {
                const body = JSON.parse(rawBody);
                if(body.error?.data?.code === "NOT_FOUND")
                    return resolver(req, res);

                for(const [key, value] of Array.from(headerMap.entries()))
                    setHeader(key, value);
                end(rawBody);
            }
        });
    })

    Server.listeners.push({
        title: "tRPC",
        handler
    });
}
