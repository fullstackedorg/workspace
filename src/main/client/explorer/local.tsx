import Explorer, {ExplorerOptions} from "./explorer";
import React, { RefObject, useEffect, useState } from "react";
import { fsLocal } from "./clients/local";
import { compareAndResolveKey, hasUnresolvedConflict, keyIsConflicted, resolveAllKey } from "../sync/conflicts";
import { SyncWS } from "../sync/Indicator";
import { client } from "../client";
import type { SyncStatus } from "../sync/status";
import { fsCloud } from "./clients/cloud";

export default function (props: {explorerRef: RefObject<Explorer>, options: ExplorerOptions}) {
    const [conflicts, setConflicts] = useState<SyncStatus['conflicts']>(null);

    useEffect(() => {
        client.get().syncConflicts().then(setConflicts);

        const callback = (status: SyncStatus) => {
            setConflicts(status.conflicts);
        }

        SyncWS.subscribers.add(callback);
        return () => {SyncWS.subscribers.delete(callback)}
    }, [])

    return <Explorer ref={props.explorerRef} client={fsLocal} action={(item) => {
        if(!conflicts)
            return <></>;

        if(conflicts[item.key]){
            return hasUnresolvedConflict(conflicts[item.key])
                ? <button className={"small danger"} onClick={e => {
                        e.stopPropagation();
                        resolveAllKey(item.key, conflicts[item.key])
                    }}>Resolve All</button>
                : <button onClick={(e) => {
                        e.stopPropagation();
                        fsCloud.post().sync(item.key);
                    }} className="small">Pull</button>
        }

        const isKeyConflicted = keyIsConflicted(item.key, conflicts);
        if(isKeyConflicted === null)
            return <></>;

        return <button className={"small " + (isKeyConflicted.resolved ? "danger" : "")} onClick={e => {
                    e.stopPropagation();
                    compareAndResolveKey(isKeyConflicted.baseKey, item.key)
                }}>{isKeyConflicted.resolved ? "Resolve" : "Compare"}</button>

    }} options={props.options} />
}

