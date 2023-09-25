import {client} from "../client";
import CodeOSSIcon from "../icons/code-oss.svg";
import React from "react";
import CommandPalette from "../commandPalette";
import AddApp from "../workspace/AddApp";

const portCodeOSS = await client.get(true).portCodeOSS();
if(portCodeOSS){
    const inDocker = await client.get(true).isInDockerRuntime();
    AddApp({
        title: "Code",
        icon: CodeOSSIcon,
        order: 3,
        element: ({args: {folder}}) => {
            const host = !inDocker && window.location.host.match(/localhost:\d\d\d\d/g)
                ? `localhost:${portCodeOSS}`
                : `${portCodeOSS}.${window.location.host}`;

            const url = new URL(`${window.location.protocol}//${host}`);
            url.search = `folder=${folder}`;

            return <iframe src={url.toString()} />
        },
        args: {
            folder: await client.get(true).currentDir()
        },
        callbacks: {
            onFocus() {
                let openCommandPalette = true;
                const blurEvent = () => {
                    setTimeout(() => {
                        if(openCommandPalette)
                            CommandPalette.instance.toggle();
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
