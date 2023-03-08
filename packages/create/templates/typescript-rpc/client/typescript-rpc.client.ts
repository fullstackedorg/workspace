import type api from "../server/typescript-rpc.server";
import createClient from "typescript-rpc/createClient";

const client = createClient<typeof api>(window.location.origin + "/typescript-rpc");


const div = document.createElement("div");
div.setAttribute("id", "typescript-rpc")
document.body.append(div);

await client.ready();

div.innerHTML = await client.helloWorld();

