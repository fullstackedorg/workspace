import React, {useEffect} from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export default function () {
    useEffect(() => {
        const commandsWS = new WebSocket("ws" +
            (window.location.protocol === "https:" ? "s" : "") +
            "://" + window.location.host + "/fullstacked-commands");

        let currentLine = "", path = "";
        const term = new Terminal();
        let fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(document.querySelector('.terminal'));
        fitAddon.fit();
        term.write('# ');
        term.onKey(({key, domEvent}) => {
            if(domEvent.key === "Backspace"){
                currentLine = currentLine.slice(0, -1);
                term.write('\b \b');
            }else if(domEvent.key === "Enter"){
                const cmd = (path ? `cd ${path} &&` : "") + currentLine;
                commandsWS.send(cmd);
                currentLine = "";
                term.write('\r\n');
            }else if(domEvent.key === "c" && domEvent.ctrlKey){
                commandsWS.send("##KILL##")
            }else{
                currentLine += key;
                term.write(key);
            }
        });

        commandsWS.onmessage = e => {
            if(e.data === "##END##") {
                term.write((path ? path + " " : "") + "# ")
            }else if(e.data.match(/--.*--/)){
                path = e.data.trim().slice(3, -2);
            }else{
                term.write(e.data);
            }
        }

        window.addEventListener("resize", () => {
            fitAddon.fit();
        });
    }, [])

    return <div className={"terminal"}/>
}
