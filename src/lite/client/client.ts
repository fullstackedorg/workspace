import createClient from "@fullstacked/webapp/rpc/createClient";
import type {api} from "../server";

export const client = createClient<typeof api>();
