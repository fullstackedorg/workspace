import Explorer, {ExplorerOptions} from "./explorer";
import React from "react";
import {fsLocal} from "./clients/local";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import {client} from "../client";
import {Workspace} from "../workspace";
import Merge from "../editor/merge";
import conflictIcon from "../icons/conflict.svg"


export default function (props: {options: ExplorerOptions}) {
    const [conflicts, reloadConflicts] = useAPI(client.get().getSyncConflicts);

    return <Explorer client={fsLocal} action={(item) => {
        if(conflicts[item.key])
            return <button className={"small danger"} onClick={e => {
                e.stopPropagation();
                Object.keys(conflicts[item.key]).filter(fileKey => !conflicts[item.key][fileKey]).forEach(key => {
                    Workspace.instance.addWindow({
                        title: "Resolve",
                        icon: conflictIcon,
                        element: (app) =>
                            <Merge baseKey={item.key} fileKey={key}
                                   didResolve={() => {
                                       Workspace.instance.removeWindow(app)
                                       reloadConflicts();
                                   }} />
                    })
                })
            }}>Resolve</button>
    }} options={props.options} />
}

