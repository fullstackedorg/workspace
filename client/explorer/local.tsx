import createClient from "@fullstacked/webapp/rpc/createClient";
import type {LocalFS} from "../../server/Explorer/local-fs";
import Explorer from "./explorer";
import React from "react";

const localFSClient = createClient<typeof LocalFS>(window.location.href + "local-fs");

export default function () {
    return <Explorer client={localFSClient} />
}
