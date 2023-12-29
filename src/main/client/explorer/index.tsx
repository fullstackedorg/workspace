import React, { RefObject, createRef, useEffect, useState } from "react";
import explorerIcon from "../icons/explorer.svg";
import "./index.css";
import { Workspace } from "../workspace";
import Explorer from "./explorer";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import { client } from "../client";
import type { api } from "../../server";
import { PrepareCloudStorage } from "../sync/prepare";
import Storages from "../sync/storages";

function Explorers(props: { explorerRef: RefObject<Explorer> }) {
    const [endpoints, reloadEndpoints] = useAPI(client.get(true).storageEndpoints);
    const [currentTab, setCurrentTab] = useState(null);

    const [showHiddenFiles, setShowHiddenFiles] = useState(false);
    const [showDeleteButtons, setShowDeleteButtons] = useState(false);

    const [showSettings, setShowSettings] = useState(false);

    const changeTab = (index: number) => {
        setShowSettings(false);
        setCurrentTab(index);
    }

    return <div className={"explorer-with-tabs"}>

        <div className={"options"}>
            <div>
                {/*<button className={"small"} onClick={() => {*/}

                {/*}}>Global Ignore</button>*/}
            </div>

            <div>
                <span className={"checkbox"}>
                    <label>Delete Buttons</label>
                    <input type={"checkbox"} onChange={e => setShowDeleteButtons(e.currentTarget.checked)} checked={showDeleteButtons} />
                </span>

                <span className={"checkbox"}>
                    <label>Hidden Files</label>
                    <input type={"checkbox"} onChange={e => setShowHiddenFiles(e.currentTarget.checked)} checked={showHiddenFiles} />
                </span>
            </div>
        </div>

        <div className={"tabs"}>
            <div
                className={(currentTab === null ? "active" : "")}
                onClick={() => changeTab(null)}>
                Local
            </div>
            {endpoints?.map((({ name, origin, helloResponse }, index) => {
                const available = typeof helloResponse === "boolean" && helloResponse;

                return <div
                    className={(currentTab === index ? "active" : "") + (!available ? " unavailable" : "")}
                    onClick={() => {
                        if(currentTab === index) return;
                        changeTab(index);
                    }}
                >
                    <div className="edit" onClick={(e) => {
                        if(currentTab !== index) return;
                        e.stopPropagation();
                        setShowSettings(true)
                    }}>
                        <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"/>
                        </svg>
                    </div>
                    {name}
                    {!available
                        && <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.378 5.543l-2.378-3.396 1.638-1.147 14.602 20.853-1.639 1.147-1.4-2h-11.701c-3.037 0-5.5-2.463-5.5-5.5 0-2.702 1.951-4.945 4.521-5.408.093-1.74.778-3.322 1.857-4.549zm2.859-2.017c.854-.339 1.787-.526 2.763-.526 4.006 0 7.267 3.141 7.479 7.092 2.57.463 4.521 2.706 4.521 5.408 0 2.121-1.202 3.963-2.962 4.88l-11.801-16.854z" />
                        </svg>}
                    {showSettings && currentTab === index && <StorageSettings 
                        endpoint={endpoints.at(currentTab)}
                        done={async () => {
                            await client.get().storageEndpoints();
                            setShowSettings(false);
                            reloadEndpoints();
                        }} 
                    />}
                </div>
            }))
            }
            <div onClick={e => {
                Workspace.instance.addWindow({
                    title: "Setup",
                    icon: "",
                    element(app) {
                        return <PrepareCloudStorage />
                    }
                })
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </div>
        </div>
        <div>
            {
                currentTab === null
                    ? <Explorer
                        options={{ showDeleteButtons, showHiddenFiles }}
                        origin={null}
                        action={item => item.isDir && <Push itemKey={item.key} storages={endpoints} />}
                    />
                    : typeof endpoints.at(currentTab).helloResponse === "boolean"
                        && endpoints.at(currentTab).helloResponse
                        ? <Explorer
                            options={{ showDeleteButtons, showHiddenFiles }}
                            origin={endpoints.at(currentTab).origin}
                            action={item => item.isDir && <Pull itemKey={item.key} storage={endpoints.at(currentTab)} />}
                        />
                        : <PrepareCloudStorage 
                            initialHelloResponse={endpoints.at(currentTab).helloResponse} 
                            endpoint={endpoints.at(currentTab).origin}
                        />
            }

        </div>
    </div>
}


function Push(props: { 
    itemKey: string,
    storages: Awaited<ReturnType<typeof api.storageEndpoints>>
}) {
    if(!props.storages)
        return <></>;

    const availableEndpoint = props.storages.filter(({helloResponse}) => typeof helloResponse === "boolean" && helloResponse);

    if(availableEndpoint.length === 0)
        return <></>;
    else if(availableEndpoint.length === 1) {
        return <button 
            className="small" 
            onClick={(e) => {
                e.stopPropagation();
                client.post().push(props.itemKey, availableEndpoint.at(0).origin);
            }}
        >
            Sync
        </button>
    }
    else {
        return <button 
            className="small"
        >
            Sync...
        </button>
    }
}

function Pull(props: {
    itemKey: string,
    storage: Awaited<ReturnType<typeof api.storageEndpoints>>[0]
}) {
    return <button 
        className="small" 
        onClick={(e) => {
            e.stopPropagation();
            client.post().pull(props.storage.origin, props.itemKey);
        }}
    >
        Sync
    </button>
}

function StorageSettings(props: {
    endpoint: Awaited<ReturnType<typeof api.storageEndpoints>>[0], 
    done: () => void
}){
    const [value, setValue] = useState(props.endpoint.name);

    return <div className="rename">
        <form onSubmit={async e => {
            e.preventDefault();
            await client.put().updateStorageName(props.endpoint.origin, value)
            props.done();
        }}>
            <input value={value} onChange={e => setValue(e.currentTarget.value)} />
        </form>
        <button
            className="danger" 
            onClick={async () => {
                await client.delete().removeStorage(props.endpoint.origin);
                props.done();
            }}
        >
            Remove
        </button>
    </div>
}

Workspace.addApp({
    title: "Explorer",
    icon: explorerIcon,
    order: 1,
    element: (app) => {
        const explorerRef = createRef<Explorer>();

        app.callbacks = {
            onFocus: () => {
                if (!explorerRef.current) return;
                explorerRef.current.reloadOpenedDirectories();
            }
        }


        return <Explorers explorerRef={explorerRef} />
    }
});
