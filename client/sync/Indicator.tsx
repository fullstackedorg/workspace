import React, {useEffect, useState} from "react";
import {SyncStatus} from "./status";
import {createRoot} from "react-dom/client";

export function RenderSyncIndicator(){
    // render only once
    if(document.querySelector("#sync")) return;

    const div = document.createElement("div");
    div.setAttribute("id", "sync");
    document.body.append(div);
    const root = createRoot(div)
    root.render(<Indicator remove={() => {
        root.unmount();
        div.remove();
    }} />);
}

function initWS(cb) {
    const wsURL = "ws" +
        (window.location.protocol === "https:" ? "s" : "") +
        "://" + window.location.host + "/fullstacked-sync";

    const ws = new WebSocket(wsURL);

    ws.onmessage = cb;
    ws.onclose = () => {
        if(!document.querySelector("#sync")) return;

        initWS(cb)
    };
}

function Indicator(props: {remove(): void}){
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

            setStatus(status);
            updateLastSyncInterval();
        })

        const updateLastSyncInterval = () => {
            if(status?.status !== "synced") return;
            setLastSyncInterval(msDurationToHumanReadable(Date.now() - status.lastSync));
        }

        const interval = setInterval(updateLastSyncInterval, 10000);

        return () => {
            console.log("ici");
            clearInterval(interval);
        }
    }, []);

    if(!status)
        return <></>

    return <>
        {status.status === "synced"
            ? lastSyncInterval && <>Synced {lastSyncInterval} ago</>
            : status.status === "initializing"
                ? <>Initializing...</>
                : status.status === "syncing"
                    ? <>Syncing...</>
                    // error
                    : <>{status.message}</>}
    </>
}

const msForSecond = 1000;
const msForMinute = msForSecond * 60;
const msForHour = msForMinute * 60;
function msDurationToHumanReadable(ms: number){
    const hours   = Math.floor(ms / msForHour);
    const minutes = Math.floor((ms - (hours * msForHour)) / msForMinute);
    const seconds = Math.floor((ms - (hours * msForHour) - (minutes * msForMinute)) / msForSecond);

    return (hours ? `${hours}h `: "") +
        (minutes ? `${minutes}m ` : "") +
        ((seconds || (!minutes && !hours)) ? `${seconds}s` : "");
}
