import "./index.css";
import React from "react";
import {client} from "../client";
import CommandPalette from "../commandPalette";
import {Workspace} from "../workspace";
import {PrepareFsRemote} from "../explorer/cloud";
import {RenderSyncIndicator} from "./Indicator";

export class Sync {
    static init() {
        client.post().initSync()
            .then(response => {
                if((response && typeof response === 'boolean') || !response) return;

                CommandPalette.instance.setState({show: false});
                Workspace.instance.addWindow({
                    title: "Sync",
                    icon: "",
                    element: () => <PrepareFsRemote onSuccess={() => {
                        Workspace.instance.removeWindow(Workspace.instance.getActiveApp().find(app => app.title === "Sync"));
                        Sync.init();
                    }} />
                });
            });

        RenderSyncIndicator();
    }
}
