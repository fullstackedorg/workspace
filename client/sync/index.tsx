import "./index.css";
import React from "react";
import {client} from "../client";
import {Workspace} from "../workspace";
import {PrepareFsRemote} from "../explorer/cloud";
import {RenderSyncIndicator} from "./Indicator";
import syncIcon from "../icons/sync.svg";

export class Sync {
    static isInit: boolean = false;
    static init() {
        client.post().initSync()
            .then(response => {
                if((response && typeof response === 'boolean') || !response) {
                    Sync.isInit = true;
                    Workspace.addApp({
                        title: "Sync",
                        icon: syncIcon,
                        order: 5,
                        element: app => {
                            client.post().sync();
                            Workspace.instance.removeWindow(app);
                            return undefined;
                        }
                    });
                    return;
                }

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
