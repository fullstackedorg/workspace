import createClient from "@fullstacked/webapp/rpc/createClient";
import type {api} from "../server";

export const Client = createClient<typeof api>();
