import React, {Component, useEffect} from "react";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const isSafariMobile = navigator.userAgent.includes("iPad") || navigator.userAgent.includes("iPhone");

export default class Terminal extends Component {
    pingThrottler;
    commandsWS = new WebSocket("ws" +
        (window.location.protocol === "https:" ? "s" : "") +
        "://" + window.location.host + "/fullstacked-commands");
    xterm = new Xterm();
    fitAddon = new FitAddon();

    onResize(){
        this.fitAddon.fit();
        this.commandsWS.send(`SIZE#${this.xterm.cols}#${this.xterm.rows}`);
    }

    componentDidMount() {
        this.xterm.loadAddon(this.fitAddon);
        this.xterm.open(document.querySelector('.terminal'));

        const ping = () => {
            if(this.pingThrottler) clearTimeout(this.pingThrottler);
            this.pingThrottler = setTimeout(() => {
                this.commandsWS.send("##PING##");
                this.pingThrottler = null;
                ping();
            }, 30 * 1000);
        }
        ping();

        this.xterm.onKey(({key, domEvent}) => {
            // issue with ctrl+c on safari mobile
            if(key === '\x0d' && domEvent.ctrlKey && isSafariMobile){
                this.commandsWS.send('\x03');
                return ping();
            }
            this.commandsWS.send(key);
            ping();
        });

        this.xterm.attachCustomKeyEventHandler((arg) => {
            if ((arg.metaKey || arg.ctrlKey) && arg.code === "KeyV" && arg.type === "keydown") {
                navigator.clipboard.readText().then(text => {
                    this.commandsWS.send(text)
                });
            }
            return true;
        });

        this.commandsWS.onopen = () => {
            this.onResize();
        }

        this.commandsWS.onmessage = e => {
            this.xterm.write(e.data);
        }
    }

    render(){
        return <div className={"terminal"}/>
    }

}
