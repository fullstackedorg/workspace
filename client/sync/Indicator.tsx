import React, {useEffect, useState} from "react";
import {SyncStatus} from "./status";
import {createRoot} from "react-dom/client";
import prettyBytes from "pretty-bytes";
import { Workspace } from "../workspace";
import syncIcon from "../icons/sync.svg";
import { client } from "../client";
import { fsCloud } from "../explorer/clients/cloud";
import { compareAndResolveKey, hasUnresolvedConflict, resolveAllKey } from "./conflicts";

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

export class SyncWS {
    static subscribers = new Set<(status: SyncStatus) => void>();
    static init() {
        const wsURL = "ws" +
            (window.location.protocol === "https:" ? "s" : "") +
            "://" + window.location.host + "/fullstacked-sync";

        const ws = new WebSocket(wsURL);

        ws.onmessage = message => this.subscribers.forEach(callback => callback(JSON.parse(message.data)));
        ws.onclose = () => {
            if(!document.querySelector("#sync")) return;

            setTimeout(() => SyncWS.init(), 2000);
        };
    }
}

function Indicator(props: {remove(): void}){
    const [status, setStatus] = useState<SyncStatus>();
    const [lastSyncInterval, setLastSyncInterval] = useState("");

    useEffect(() => {
        let weakStatus: SyncStatus;

        const updateLastSyncInterval = () => {
            if(!weakStatus?.lastSync) return;
            setLastSyncInterval(msDurationToHumanReadable(Date.now() - weakStatus.lastSync));
        }

        SyncWS.init();
        const cb = (status: SyncStatus) => {
            weakStatus = status;

            if(status === null){
                props.remove();
                return;
            }

            setStatus(status);
            updateLastSyncInterval();
        }
        SyncWS.subscribers.add(cb);

        const interval = setInterval(updateLastSyncInterval, 10000);

        return () => {
            SyncWS.subscribers.delete(cb);
            clearInterval(interval);
        }
    }, []);

    if(!status)
        return <></>

    const isSynced =
        Object.keys(status).length !== 0
        && (!status.syncing || Object.keys(status.syncing).length === 0)
        && (!status.conflicts || Object.keys(status.conflicts).length === 0)
        && (!status.errors || status.errors.length === 0);

    const onTop = !isSynced || Date.now() - status.lastSync < 10000;

    return <div id={"sync-indicator"} className={onTop ? "on-top" : ""}>
        {Object.keys(status).length === 0 
            ? <div>Initializing...</div>
            : (isSynced && <div>Synced {lastSyncInterval} ago</div>)}

        {status.syncing && !!(Object.keys(status.syncing).length)
            && <div>
                Syncing...
                <div>
                    {Object.keys(status.syncing).map(key => <div>
                        {key}&nbsp;
                        {status.syncing[key].direction === "pull" ? <span className={"green"}>↙</span> : <span className={"red"}>↗</span>}
                    </div>)}
                </div>
                <button className="small" onClick={() => {
                    Workspace.instance.addWindow(Workspace.instance.apps.find(({title}) => title === "Sync"));
                }}>Progress</button>
            </div>}

        {status.conflicts && !!(Object.keys(status.conflicts).length)
            && <div>
                Conflicts
                <div>
                    {Object.keys(status.conflicts).map(key => {
                        return <div>
                            <div>{hasUnresolvedConflict(status.conflicts[key])
                                ? <button 
                                    onClick={() => resolveAllKey(key, status.conflicts[key])} 
                                    className="small danger"
                                >
                                    Resolve All
                                </button>
                                : <button 
                                    onClick={() => fsCloud.post().sync(key)} 
                                    className="small"
                                >
                                    Pull
                                </button>} <b>{key}</b>
                            </div>
                            <div>
                                {Object.keys(status.conflicts[key])
                                    .map(subKey => <div>
                                        {!status.conflicts[key][subKey] 
                                            ? <button 
                                                onClick={() => compareAndResolveKey(key, subKey)} 
                                                className="small danger"
                                            >
                                                Resolve
                                            </button>
                                            : <button 
                                                onClick={() => compareAndResolveKey(key, subKey)} 
                                                className="small"
                                            >
                                                Compare
                                            </button> } {subKey}
                                    </div>)}
                            </div>
                        </div>
                    })}
                </div>
            </div>}

        {status.errors && !!(status.errors.length)
            && <div>
                Errors
                <div>
                    {status.errors.map((error, i) => <div>
                        {error} <button onClick={() => client.delete().dismissSyncError(i)} className="small">dismiss</button> 
                    </div>)}
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

export function AddSyncApp(){
    if ( Workspace.instance.apps.find(({title}) => title === "Sync") )
        return;

    Workspace.addApp({
        title: "Sync",
        icon: syncIcon,
        order: 7,
        element: (app) => {
            return <SyncProgressView />
        }
    });
}

function SyncProgressView() {
    const [status, setStatus] = useState<SyncStatus>();

    useEffect(() => {
        SyncWS.subscribers.add(setStatus);
        client.post().sync();
        return () => {SyncWS.subscribers.delete(setStatus)}
    }, [])

    if(!status?.syncing) return <></>

    const syncingKeys = Object.keys(status.syncing);

    return <div className="sync-progress-view">

        {syncingKeys.length
            ? syncingKeys.map(key => {
                const syncingKey = status.syncing[key];
                const items = status.syncing[key].progress?.items;
                const streams = status.syncing[key].progress?.streams;
    
                return <div>
                    <div>
                        <b>{key}</b> 
                        {syncingKey.direction === "pull" 
                            ? <span className={"green"}>↙</span> 
                            : <span className={"red"}>↗</span>}
                    </div>
                    
                    {items && <div>{items.completed}/{items.total}</div>}
                    
                    {streams && Object.keys(streams).map(stream => {
                        const progress = streams[stream].transfered / streams[stream].total * 100;
                        if(!progress || isNaN(progress))
                            return <></>;
    
                        return <div>{progress.toFixed(2)} ({prettyBytes(streams[stream].total)}) {streams[stream].itemPath}</div>
                    })}
                </div>
            })
            : <div>Syncing Done</div>
        }
    </div>
}
