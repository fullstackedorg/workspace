import React, {useEffect, useState} from "react";
import {SyncStatus} from "./status";
import {createRoot} from "react-dom/client";

export function RenderSyncIndicator(onError: () => void){
    // render only once
    if(document.querySelector("#sync")) return;

    const div = document.createElement("div");
    div.setAttribute("id", "sync");
    document.body.append(div);
    const root = createRoot(div)
    root.render(<Indicator remove={() => {
        root.unmount();
        div.remove();
    }} didError={onError} />);
}

function initWS(cb) {
    const wsURL = "ws" +
        (window.location.protocol === "https:" ? "s" : "") +
        "://" + window.location.host + "/fullstacked-sync";

    const ws = new WebSocket(wsURL);

    ws.onmessage = cb;
    ws.onclose = () => {
        if(!document.querySelector("#sync")) return;

        setTimeout(() => initWS(cb), 2000);
    };
}

function Indicator(props: {remove(): void, didError(): void}){
    const [status, setStatus] = useState<SyncStatus>();
    const [lastSyncInterval, setLastSyncInterval] = useState("");

    useEffect(() => {
        let status: SyncStatus
        initWS(message => {
            status = JSON.parse(message.data);

            if(status === null){
                props.remove();
                return;
            }

            if(status.status === "error"){
                props.didError();
            }

            setStatus(status);
            updateLastSyncInterval();
        })

        const updateLastSyncInterval = () => {
            if(status?.status !== "synced") return;
            setLastSyncInterval(msDurationToHumanReadable(Date.now() - status.lastSync));
        }

        const interval = setInterval(updateLastSyncInterval, 10000);

        return () => {
            clearInterval(interval);
        }
    }, []);

    if(!status)
        return <></>

    return <div id={"sync-indicator"}>
        {status.status === "synced"
            ? lastSyncInterval && <div className={Date.now() - status.lastSync < 10000 ? "on-top" : ""}>Synced {lastSyncInterval} ago</div>
            : status.status === "initializing"
                ? <div>Initializing...</div>
                : status.status === "syncing"
                    ? <div className={"on-top"}>
                        Syncing...
                        <div>
                            {status.keys.map(key => <div>{key}</div>)}
                        </div>
                    </div>
                    : status.status === "conflicts"
                        ? <div>Sync conflicts</div>
                        : <div className={"on-top"}>{status.message}</div>}
    </div>
}

const msForSecond = 1000;
const msForMinute = msForSecond * 60;
const msForHour = msForMinute * 60;
function msDurationToHumanReadable(ms: number){
    if(ms <= 0) ms = 0;

    const hours   = Math.floor(ms / msForHour);
    const minutes = Math.floor((ms - (hours * msForHour)) / msForMinute);
    const seconds = Math.floor((ms - (hours * msForHour) - (minutes * msForMinute)) / msForSecond);

    return (hours ? `${hours}h `: "") +
        (minutes ? `${minutes}m ` : "") +
        ((seconds || (!minutes && !hours)) ? `${seconds}s` : "");
}
