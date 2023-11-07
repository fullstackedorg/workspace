import "./index.css";
import React from "react";
import {client} from "../client";
import {Workspace} from "../workspace";
import {RenderSyncIndicator} from "./Indicator";
import syncIcon from "../icons/sync.svg";
import {PrepareFsRemote} from "./prepare";

export class Sync {
    static isInit: boolean = false;
    static init(callback?: () => void, force = false) {
        client.post().initSync()
            .then(async response => {
                if((response && typeof response === 'boolean') || !response) {
                    if(!Sync.isInit){
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
                    }

                    await client.get().getSyncedKeys();

                    if(callback)
                        callback();
                    return;
                }

                if(!force && !await client.get().getSyncDirectory())
                    return;

                Workspace.instance.commandPaletteRef.current.setState({show: false});
                Workspace.instance.addWindow({
                    title: "Sync",
                    icon: syncIcon,
                    element: ({id}) => <PrepareFsRemote onSuccess={() => {
                        Workspace.instance.removeWindow(Workspace.instance.activeApps.get(id));
                        Sync.init(callback);
                    }} />
                });
            });

        RenderSyncIndicator();
    }
}
