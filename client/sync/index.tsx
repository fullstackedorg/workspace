import "./index.css";
import React from "react";
import {client} from "../client";
import CommandPalette from "../commandPalette";
import {Workspace} from "../workspace";
import {PrepareFsRemote} from "../explorer/cloud";
import {RenderSyncIndicator} from "./Indicator";
import syncIcon from "../icons/sync.svg";

export class Sync {
    static init() {
        client.post().initSync()
            .then(response => {
                if((response && typeof response === 'boolean') || !response) return;

                Workspace.instance.commandPaletteRef.current.setState({show: false});
                Workspace.instance.addWindow({
                    title: "Sync",
                    icon: syncIcon,
                    element: ({id}) => <PrepareFsRemote onSuccess={() => {
                        Workspace.instance.removeWindow(Workspace.instance.activeApps.get(id));
                        Sync.init();
                    }} />
                });
            });

        RenderSyncIndicator();
    }
}
