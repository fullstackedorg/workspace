import createClient from "@fullstacked/webapp/rpc/createClient";
import type {fsLocal as fsLocalType} from "../../../server/sync/fs-local";

export const fsLocal = createClient<typeof fsLocalType>(window.location.protocol + "//" + window.location.host + "/fs-local");
