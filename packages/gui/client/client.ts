import createClient from "typescript-rpc/createClient";
import type api from "../server";

export const Client = createClient<typeof api>(window.location.origin + "/typescript-rpc");

await Client.ready();