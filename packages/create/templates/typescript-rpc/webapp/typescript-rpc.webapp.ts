import type api from "../server/typescript-rpc.server";
import createClient from "typescript-rpc/createClient";

const client = createClient<typeof api>();

(async () => {
    const div = document.createElement("div");
    div.setAttribute("id", "hello-from-typescript-rpc")
    document.body.append(div);

    await client.ready();

    div.innerHTML = await client.hello();
})()
