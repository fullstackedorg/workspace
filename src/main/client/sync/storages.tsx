import useAPI from "@fullstacked/webapp/client/react/useAPI";
import React from "react";
import { client } from "../client";

export default function() {
    const [endpoints] = useAPI(client.get().storageEndpoints, true);

    return <div>
        {endpoints?.map(endpoint => <div>{endpoint.name}</div>)}
        <form>
            Add Storage
            <input />
        </form>
    </div>
}