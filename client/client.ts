import createClient from "@fullstacked/webapp/rpc/createClient";
import type {API} from "../server";

export const client = createClient<typeof API>();
