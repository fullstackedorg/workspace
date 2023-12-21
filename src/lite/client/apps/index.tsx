import React, { useState, useEffect } from "react";
import { client } from "../client"
import { SyncWS, centeredPopupFeatures } from "../../../main/client/sync/Indicator";
import { Workspace } from "../../../main/client/workspace";

function AppLauncher(props: {app, didSpawn}){
    const [failedOpen, setFailedOpen] = useState(false);
    const [url, setUrl] = useState(null);

    const openApp = (url: string) => {
        const win = window.open(url, "", centeredPopupFeatures());
        setFailedOpen(!win);
        if(win)
            props.didSpawn()
    }

    useEffect(() => {
        client.post().runApp(props.app.entrypoint)
            .then(url => {
                setUrl(url);
                openApp(url);
            })
    }, [])

    return <div className={"prepare-fs-remote"}>
        {url 
            ? failedOpen 
                ? <button onClick={() => openApp(url)}>Open {props.app.title}</button>
                : <div>{props.app.title} Running</div>
            : <div>Loading {props.app.title}</div>}
    </div>
}

function loadLocalApps(){
    client.get().listApps().then(apps => {
        apps.forEach(app => {
            if(Workspace.instance.apps.find(({title}) => title === app.title))
                return;

            Workspace.addApp({
                title: app.title,
                icon: app.icon,
                element: (wApp) => <AppLauncher didSpawn={Workspace.instance.removeWindow(wApp)} app={app} />
            })
        })
    })
}

SyncWS.subscribers.add(status => {
    if(SyncWS.isSynced(status))
        loadLocalApps();
});