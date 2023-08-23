import {client} from "../client";
import {Workspace} from "../workspace";
import CodeOSSIcon from "../icons/code-oss.svg";
import React from "react";

if(await client.get(true).hasCodeOSS()){
    Workspace.apps.push({
        title: "Code",
        icon: CodeOSSIcon,
        element: () => {
            const url = new URL(`${window.location.protocol}//8888.${window.location.host}`);
            return <iframe src={url.toString()} />
        }
    });
}
