import {client} from "../client";
import {Workspace} from "../workspace";
import CodeOSSIcon from "../icons/code-oss.svg";
import React from "react";
import CommandPalette from "../commandPalette";

if(await client.get(true).hasCodeOSS()){
    Workspace.apps.push({
        title: "Code",
        icon: CodeOSSIcon,
        order: 3,
        element: () => {
            const host = window.location.host.match(/localhost:\d\d\d\d/g)
                ? `localhost:8888`
                : `8888.${window.location.host}`;

            const url = new URL(`${window.location.protocol}//${host}`);
            return <iframe src={url.toString()} />
        },
        callbacks: {
            onFocus() {
                console.log("ici")
                let openCommandPalette = true;
                const blurEvent = () => {
                    setTimeout(() => {
                        console.log(openCommandPalette)
                        if(openCommandPalette)
                            CommandPalette.instance.open();
                    }, 100);
                    window.removeEventListener("focus", blurEvent);
                }
                const clickEvent = () => {
                    console.log("click")
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
