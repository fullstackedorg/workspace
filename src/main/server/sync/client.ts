import { RsyncHTTP2Client } from "@fullstacked/sync/http2/client";
import createClient from "@fullstacked/webapp/rpc/createClient";
import type { promises } from "fs";

export const SyncEndpoint = process.env.STORAGE_ENDPOINT || "https://auth.fullstacked.cloud/storages";

export const SyncClient: {
    fs: ReturnType<typeof createClient<typeof promises>>,
    rsync: RsyncHTTP2Client
} = {
    fs: createClient(SyncEndpoint),
    rsync: new RsyncHTTP2Client(SyncEndpoint)
}