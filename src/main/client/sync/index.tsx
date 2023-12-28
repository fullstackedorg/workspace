import "./index.css";
import React from "react";
import {client} from "../client";
import {Workspace} from "../workspace";
import syncIcon from "../icons/sync.svg";
import { PrepareCloudStorage } from "./prepare";
import { AddSyncApp, RenderSyncIndicator } from "./Indicator";

export class Sync {
    static isInit: boolean = false;
    static async init(addSyncApp = true, force = false) {
        RenderSyncIndicator();

        const initResponse = await client.get().initSync();
        // if user has no config, don't force him into Cloud Sync
        if(typeof initResponse === "object" && (initResponse.error === "no_config" && !force))
            return;
        else if(typeof initResponse === "boolean" && initResponse){
            Sync.isInit = true;
            if(addSyncApp)
                AddSyncApp();
            return;
        }

        Workspace.instance.addWindow({
            title: "Sync",
            icon: syncIcon,
            element: (app) => {
                return <PrepareCloudStorage addSyncApp={addSyncApp} onSuccess={() => Workspace.instance.removeWindow(app)} />
            }
        })
    }
}
