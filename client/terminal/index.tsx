import React, {Component, createRef} from "react";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { WebLinksAddon } from 'xterm-addon-web-links';
import Browser from "../browser";
import {createRoot} from "react-dom/client";
import {createWindow} from "../app/WinStore";
import {openCodeOSS} from "../codeOSS";
import {openExplorer} from "../app/files";

export default class Terminal extends Component<{ onFocus(): void }> {
    pingThrottler;
    ws = new WebSocket("ws" +
        (window.location.protocol === "https:" ? "s" : "") +
        "://" + window.location.host + "/fullstacked-commands");
    xtermRef = createRef<HTMLDivElement>();
    xterm = new Xterm();
    fitAddon = new FitAddon();
    webLinks = new WebLinksAddon((e, uri) => {
        if(uri.match(/http:\/\/localhost:\d+/g)){
            const url = new URL(uri);
            const div = document.createElement("div");
            const { id } = createWindow("Browser", {mount: div});
            createRoot(div).render(<Browser id={id} port={url.port} path={url.pathname} />);

            return;
        }

        window.open(uri, '_blank').focus();
    });

    onResize(){
        this.fitAddon.fit();
        this.ws.send(`SIZE#${this.xterm.cols}#${this.xterm.rows}`);
    }

    componentDidMount() {
        this.xterm.loadAddon(this.fitAddon);
        this.xterm.loadAddon(this.webLinks);
        this.xterm.open(this.xtermRef.current);
        this.xterm.focus();

        const ping = () => {
            if(this.pingThrottler) clearTimeout(this.pingThrottler);
            this.pingThrottler = setTimeout(() => {
                this.ws.send("##PING##");
                this.pingThrottler = null;
                ping();
            }, 30 * 1000);
        }
        ping();

        this.xterm.onKey(({key, domEvent}) => {
            // issue with ctrl+c on safari mobile
            if(key === '\x0d' && domEvent.ctrlKey){
                this.ws.send('\x03');
                return ping();
            }
            this.ws.send(key);
            ping();
        });

        this.xterm.attachCustomKeyEventHandler((arg) => {
            if ((arg.metaKey || arg.ctrlKey) && arg.code === "KeyV" && arg.type === "keydown") {
                navigator.clipboard.readText().then(text => {
                    this.ws.send(text)
                });
            }
            return true;
        });

        this.xterm.textarea.addEventListener("focus", this.props.onFocus);

        this.ws.onopen = () => {
            this.onResize();
        }

        this.ws.onmessage = e => {
            if(e.data.startsWith("CODE#")){
                openCodeOSS(e.data.split("#").pop());
                return;
            }else if(e.data.startsWith("OPEN#")){
                openExplorer(e.data.split("#").pop());
                return;
            }

            this.xterm.write(e.data);
        }
    }

    render(){
        return <div ref={this.xtermRef} className={"terminal"} />
    }

}
