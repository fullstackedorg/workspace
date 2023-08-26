import {client} from "../client";
import {Workspace} from "../workspace";
import CodeOSSIcon from "../icons/code-oss.svg";
import React from "react";
import CommandPalette from "../commandPalette";

if(await client.get(true).hasCodeOSS()){
    Workspace.apps.push({
        title: "Code",
        icon: CodeOSSIcon,
        element: () => {
            const url = new URL(`${window.location.protocol}//8888.${window.location.host}`);
            return <iframe src={url.toString()} />
        },
        callbacks: {
            onFocus() {
                let openCommandPalette = true;
                const blurEvent = () => {
                    setTimeout(() => {
                        if(openCommandPalette)
                            CommandPalette.instance.open();
                    }, 50);
                    window.removeEventListener("focus", blurEvent);
                }
                const clickEvent = () => {
                    openCommandPalette = false;
                    window.removeEventListener("mousedown", clickEvent);
                    window.removeEventListener("touchstart", clickEvent);
                }
                window.addEventListener("mousedown", clickEvent);
                window.addEventListener("touchstart", clickEvent);
                window.addEventListener("focus", blurEvent);
            }
        }
    });
}
