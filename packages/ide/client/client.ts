import createClient from "@fullstacked/webapp/rpc/createClient";
import type {tsAPI} from "../server";

export const client = createClient<typeof tsAPI>();