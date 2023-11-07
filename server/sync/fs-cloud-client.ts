import createClient from "@fullstacked/webapp/rpc/createClient";
import type {promises} from "fs";

export const fsCloudClient: ReturnType<typeof createClient<typeof promises & {
    readFilePart(path: string, start: number, end: number): Buffer
}>> = createClient();
