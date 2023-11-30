import createClient from "@fullstacked/webapp/rpc/createClient";
import type {promises} from "fs";

// allow insecure https when not in production
if(process.env.FULLSTACKED_ENV === "development"){
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
}

export const SyncEndpoint = process.env.STORAGE_ENDPOINT || "https://auth.fullstacked.cloud/storages";

export const fsCloudClient: ReturnType<typeof createClient<typeof promises & {
    readFilePart(path: string, start: number, end: number): Buffer
}>> = createClient(SyncEndpoint);
