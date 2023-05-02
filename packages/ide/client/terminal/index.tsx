import React, {useEffect} from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

let pingThrottler;
export default function () {
    useEffect(() => {
        const commandsWS = new WebSocket("ws" +
            (window.location.protocol === "https:" ? "s" : "") +
            "://" + window.location.host + "/fullstacked-commands");

        const term = new Terminal();
        let fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(document.querySelector('.terminal'));

        const resize = () => {
            fitAddon.fit();
            commandsWS.send(`SIZE#${term.cols}#${term.rows}`);
        }

        const ping = () => {
            if(pingThrottler) clearTimeout(pingThrottler);
            pingThrottler = setTimeout(() => {
                commandsWS.send("##PING##");
                pingThrottler = null;
                ping();
            }, 30 * 1000);
        }
        ping();

        term.onKey(({key, domEvent}) => {
            commandsWS.send(key);
            ping();
        });

        term.attachCustomKeyEventHandler((arg) => {
            if ((arg.metaKey || arg.ctrlKey) && arg.code === "KeyV" && arg.type === "keydown") {
                navigator.clipboard.readText().then(text => {
                    commandsWS.send(text)
                });
            }
            return true;
        });

        commandsWS.onopen = () => {
            resize();
        }

        commandsWS.onmessage = e => {
            term.write(e.data);
        }

        window.addEventListener("resize", () => resize());
    }, [])

    return <div className={"terminal"}/>
}
