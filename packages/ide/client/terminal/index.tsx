import React, {Component} from "react";
import WinBox from "winbox/src/js/winbox";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { WebLinksAddon } from 'xterm-addon-web-links';
import Browser from "../browser";
import {createRoot} from "react-dom/client";
import {getWidth, iframeWinBoxes, makeid} from "../app/WinStore";

const winOptions = {
    x: "center",
    y: "center",
    width: getWidth()
}

export default class Terminal extends Component {
    pingThrottler;
    commandsWS = new WebSocket("ws" +
        (window.location.protocol === "https:" ? "s" : "") +
        "://" + window.location.host + "/fullstacked-commands");
    xterm = new Xterm();
    fitAddon = new FitAddon();
    webLinks = new WebLinksAddon((e, uri) => {
        if(uri.match(/http:\/\/localhost:\d+/g)){
            const id = makeid(6);
            const url = new URL(uri);
            const div = document.createElement("div");
            iframeWinBoxes.set(id, new WinBox("Browser", {...winOptions, mount: div}));
            createRoot(div).render(<Browser id={id} port={url.port} path={url.pathname} />);

            return;
        }

        window.open(uri, '_blank').focus();
    });

    onResize(){
        this.fitAddon.fit();
        this.commandsWS.send(`SIZE#${this.xterm.cols}#${this.xterm.rows}`);
    }

    componentDidMount() {
        this.xterm.loadAddon(this.fitAddon);
        this.xterm.loadAddon(this.webLinks);
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
            if(key === '\x0d' && domEvent.ctrlKey){
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
