import createClient from "@fullstacked/webapp/rpc/createClient";
import type {fsCloud as fsCloudType} from "../../../server/sync/fs/cloud";

export const fsCloud = createClient<typeof fsCloudType>(window.location.protocol + "//" + window.location.host + "/fs-cloud");
