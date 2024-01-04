import "./index.css";
import React from "react";
import {client} from "../client";
import {Workspace} from "../workspace";
import { AddSyncApp, RenderSyncIndicator } from "./Indicator";
import { Setup } from "./setup";
import type { SyncDirection } from "../../server/sync/types";

export class Sync {
    static isInit: boolean = false;
    static async init(addSyncApp = true) {
        const initResponse = await client.post().syncInit();
        
        if(initResponse?.error === "no_config")
            return;

        const onReady = () => {
            Sync.isInit = true;
            RenderSyncIndicator();
            client.post().storages.initialize()
                .then(() => client.post().sync.sync("pull" as SyncDirection.PULL));
            
            if(addSyncApp)
                AddSyncApp();
        }

        if(initResponse.error !== "already_initialized"){
            Sync.openSetup(onReady);
            return;
        }

        onReady();
    }
    static openSetup(onReady: () => void){
        Workspace.instance.addWindow({
            title: "Sync",
            icon: "",
            element(app) {
                return <Setup 
                    didInit={() => {
                        Workspace.instance.removeWindow(app);
                        onReady();
                    }} 
                />
            }
        })
    }
}