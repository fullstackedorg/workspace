import createClient from "@fullstacked/webapp/rpc/createClient";
import type {promises} from "fs";

export const fsCloudClient: ReturnType<typeof createClient<typeof promises>> = createClient<typeof promises>();
