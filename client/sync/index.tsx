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
                    element: ({id}) => <PrepareFsRemote onSuccess={() => {
                        Workspace.instance.removeWindow(Workspace.instance.activeApps.get(id));
                        Sync.init();
                    }} />
                });
            });

        RenderSyncIndicator();
    }
}
