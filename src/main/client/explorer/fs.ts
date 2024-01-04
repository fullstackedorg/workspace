import createClient from "@fullstacked/webapp/rpc/createClient";
import type fsType from "../../server/sync/fs";

export const fsClient = createClient<typeof fsType>(window.location.protocol + "//" + window.location.host + "/fs");
