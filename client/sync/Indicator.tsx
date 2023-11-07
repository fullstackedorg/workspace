import React, {useEffect, useState} from "react";
import {SyncStatus} from "./status";
import {createRoot} from "react-dom/client";
import prettyBytes from "pretty-bytes";

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

        setTimeout(() => initWS(cb), 2000);
    };
}

function Indicator(props: {remove(): void}){
    const [status, setStatus] = useState<SyncStatus>();
    const [lastSyncInterval, setLastSyncInterval] = useState("");

    useEffect(() => {
        let status: SyncStatus;
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
            if(!status?.lastSync) return;
            setLastSyncInterval(msDurationToHumanReadable(Date.now() - status.lastSync));
        }

        const interval = setInterval(updateLastSyncInterval, 10000);

        return () => {
            clearInterval(interval);
        }
    }, []);

    if(!status)
        return <></>

    const isSynced =
        (!status.syncing || Object.keys(status.syncing).length === 0)
        && (!status.conflicts || Object.keys(status.conflicts).length === 0)
        && (!status.largeFiles || Object.keys(status.largeFiles).length === 0)
        && (!status.errors || status.errors.length === 0);

    const keyHasUnresolvedConflict = (key) => status.conflicts
        && Object.keys(status.conflicts[key]).length
        && Object.keys(status.conflicts[key]).find(subKey => !status.conflicts[key][subKey])

    const onTop = !isSynced || Date.now() - status.lastSync < 10000;

    return <div id={"sync-indicator"} className={onTop ? "on-top" : ""}>
        {isSynced && (!lastSyncInterval
            ? <div>Initializing...</div>
            : <div>Synced {lastSyncInterval} ago</div>)}

        {status.syncing && !!(Object.keys(status.syncing).length)
            && <div>
                Syncing...
                <div>
                    {Object.keys(status.syncing).map(key => <div>
                        {key}&nbsp;
                        {status.syncing[key] === "pull" ? <span className={"green"}>↙</span> : <span className={"red"}>↗</span>}
                    </div>)}
                </div>
            </div>}

        {status.conflicts && !!(Object.keys(status.conflicts).length)
            && Object.keys(status.conflicts).find(key => keyHasUnresolvedConflict(key))
            && <div>
                Conflicts
                <div>
                    {Object.keys(status.conflicts).map(key => {
                        if(!keyHasUnresolvedConflict(key))
                            return <></>;

                        return <div>
                            {key}
                            <div>
                                {Object.keys(status.conflicts[key])
                                    .filter(subKey => !status.conflicts[key][subKey])
                                    .map(subKey => <div>{subKey}</div>)}
                            </div>
                        </div>
                    })}
                </div>
            </div>}

        {status.largeFiles && !!(Object.keys(status.largeFiles).length)
            && <div>
                Large Files
                <div>
                    {Object.keys(status.largeFiles).map(key => <div>
                        {key} [{prettyBytes(status.largeFiles[key].total)}]&nbsp;
                        {roundTwoDigits(status.largeFiles[key].progress / status.largeFiles[key].total * 100)}%
                    </div>)}
                </div>
            </div>}

        {status.errors && !!(status.errors.length)
            && <div>
                Errors
                <div>
                    {status.errors.map(error => <div>{error}</div>)}
                </div>
            </div>}
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


function roundTwoDigits(num: number) {
    return Math.floor(num * 100) / 100;
}
