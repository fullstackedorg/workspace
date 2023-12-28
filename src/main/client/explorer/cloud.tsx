import React, { RefObject, useEffect, useState } from "react";
import Explorer, { ExplorerOptions } from "./explorer";
import { fsCloud } from "./clients/cloud";
import { Sync } from "../sync";
import { PrepareCloudStorage } from "../sync/prepare";
import { client } from "../client";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import { Workspace } from "../workspace";
import share from "../icons/share.svg";
import { copyToClipboard } from "../utils";

function Share(props: { itemKey: string }) {
    const [storageEndpoint] = useAPI(client.get().storageEndpoint);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const timeout = copied 
            ? setTimeout(() => setCopied(false), 2000)
            : null;
        
        return () => {
            if(timeout)
                clearTimeout(timeout)
        }
    }, [copied]);
    
    const url = storageEndpoint + "/" + props.itemKey;
    return <div className="basic-window">
        <div>Share</div>
        <code className="copy" onClick={e => {
            setCopied(true);
            copyToClipboard(url);
        }}>
            <span>{url}</span>
            {copied 
                ? <svg className="success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                </svg>
                : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 01-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0113.5 1.5H15a3 3 0 012.663 1.618zM12 4.5A1.5 1.5 0 0113.5 3H15a1.5 1.5 0 011.5 1.5H12z" />
                <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 019 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0116.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625v-12z" />
                <path d="M10.5 10.5a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963 5.23 5.23 0 00-3.434-1.279h-1.875a.375.375 0 01-.375-.375V10.5z" />
            </svg>
                }
            
        </code>
    </div>;
}

export default function (props: { explorerRef: RefObject<Explorer>, options: ExplorerOptions }) {
    const [apps] = useAPI(client.get().listApps);
    return Sync.isInit
        ? <Explorer
            ref={props.explorerRef}
            client={fsCloud}
            action={(item) => apps?.includes(item.key)
                && <button
                    className="small"
                    onClick={e => {
                        e.stopPropagation();
                        Workspace.instance.addWindow({
                            title: "Share",
                            icon: share,
                            element(app) {
                                console.log(item.key)
                                return <Share itemKey={item.key} />
                            }
                        })
                    }}
                >
                    Share
                </button>}
            options={props.options}
        />
        : <PrepareCloudStorage
            addSyncApp
            onSuccess={() => {
                Sync.isInit = true;
                return <Explorer ref={props.explorerRef} client={fsCloud} action={(item) => undefined} options={props.options} />
            }}
        />
}


