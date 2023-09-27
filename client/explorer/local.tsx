import createClient from "@fullstacked/webapp/rpc/createClient";
import type {fsLocal as fsLocalType} from "../../server/sync/fs-local";
import Explorer from "./explorer";
import React from "react";

const fsLocal = createClient<typeof fsLocalType>(window.location.protocol + "//" + window.location.host + "/fs-local");

export default function (props: {showHiddenFiles: boolean}) {
    return <Explorer client={fsLocal} action={(item) => undefined} showHiddenFiles={props.showHiddenFiles} />
}

