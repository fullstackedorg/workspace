import React, { useState, useEffect } from "react";
import { client } from "../client"
import { SyncWS, centeredPopupFeatures } from "../../../main/client/sync/Indicator";
import { Workspace } from "../../../main/client/workspace";
import install from "../../../main/client/icons/install.svg";
import type { App } from "../../server/apps";

function AppLauncher(props: {app: App, didSpawn: () => void}){
    const [failedOpen, setFailedOpen] = useState(false);
    const [url, setUrl] = useState(null);

    const openApp = (url: string) => {
        const win = window.open(url, "", centeredPopupFeatures());
        setFailedOpen(!win);
        if(win)
            props.didSpawn()
    }

    useEffect(() => {
        client.post().runApp(props.app.main)
            .then(url => {
                setUrl(url);
                openApp(url);
            })
    }, [])

    return <div className={"basic-window"}>
        {url 
            ? failedOpen 
                ? <button onClick={() => openApp(url)}>Open {props.app.title}</button>
                : <div>{props.app.title} Running</div>
            : <div>Loading {props.app.title}</div>}
    </div>
}

function loadLocalApps(){
    client.get().listApps().then(apps => {
        Object.values(apps).flat().forEach(app => {
            if(Workspace.instance.apps.find(({title}) => title === app.title))
                return;

            Workspace.addApp({
                title: app.title,
                icon: app.icon,
                element: (wApp) => <AppLauncher didSpawn={() => Workspace.instance.removeWindow(wApp)} app={app} />
            })
        })
    })
}


function AddApp(){
    const [url, setUrl] = useState("");

    const submit = (e) => {
        e.preventDefault();
        client.post().addApp(url).then(loadLocalApps);
    }

    return <form onSubmit={submit} className="basic-window">
        <input value={url} onChange={e => setUrl(e.currentTarget.value)} />
        <button>Add</button>
    </form>
}

Workspace.addApp({
    title: "Add App",
    icon: install,
    element(app) {
        return <AddApp />
    }
});

client.get().updateApps().then(loadLocalApps);