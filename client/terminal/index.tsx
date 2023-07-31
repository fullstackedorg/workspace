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
import {client} from "../client";

export default class Terminal extends Component<{ onFocus(): void }> {
    pid: string;
    ws: WebSocket;
    xtermRef = createRef<HTMLDivElement>();
    xterm = new Xterm();
    fitAddon = new FitAddon();
    webLinks = new WebLinksAddon((e, uri) => {
        if(uri.match(/http:\/\/(localhost|0\.0\.0\.0|127\.0\.0\.1):\d+/g)){
            const url = new URL(uri);
            const div = document.createElement("div");
            const { id } = createWindow("Browser", {mount: div});
            createRoot(div).render(<Browser id={id} port={url.port} path={url.pathname} />);
            this.xterm.blur();
            return;
        }

        window.open(uri, '_blank').focus();
    });

    reconnect = () => {
        if(document.hidden) return;

        setTimeout(() => {
            if(this.ws.readyState === WebSocket.CLOSED)
                this.connect();
        }, 1000);
    }

    constructor(props) {
        super(props);
        this.connect();
    }

    connect() {
        const wsURL = "ws" +
            (window.location.protocol === "https:" ? "s" : "") +
            "://" + window.location.host + "/fullstacked-terminal" +
            (this.pid ? `/${this.pid}` : "");

        this.ws = new WebSocket(wsURL);

        this.ws.onopen = () => this.onResize();

        this.ws.onmessage = e => {
            if(e.data.startsWith("PID#")){
                this.pid = e.data.split("#").pop();
                return;
            } else if(e.data.startsWith("CODE#")){
                openCodeOSS(e.data.split("#").pop());
                this.xterm.blur();
                return;
            } else if(e.data.startsWith("OPEN#")){
                openExplorer(e.data.split("#").pop());
                this.xterm.blur();
                return;
            }

            this.xterm.write(e.data);
        }
    }

    onResize(){
        this.fitAddon.fit();
        this.ws.send(`SIZE#${this.xterm.cols}#${this.xterm.rows}`);
    }

    onFocus() {
        this.props.onFocus();

        if(this.ws.readyState === WebSocket.CLOSED){
            this.connect();
        }
    }

    componentDidMount() {
        this.xterm.loadAddon(this.fitAddon);
        this.xterm.loadAddon(this.webLinks);
        this.xterm.open(this.xtermRef.current);
        this.xterm.focus();

        this.xterm.onKey(({key, domEvent}) => {
            // issue with ctrl+c on safari mobile
            if(key === '\x0d' && domEvent.ctrlKey){
                this.ws.send('\x03');
                return;
            }
            this.ws.send(key);
        });

        this.xterm.attachCustomKeyEventHandler((arg) => {
            if ((arg.metaKey || arg.ctrlKey) && arg.code === "KeyV" && arg.type === "keydown") {
                navigator.clipboard.readText().then(text => {
                    this.ws.send(text)
                });
            }
            return true;
        });

        this.xterm.textarea.addEventListener("focus", () => this.onFocus());

        document.addEventListener("visibilitychange", this.reconnect);
    }

    async terminate(){
        await client.post().killTerminalSession(this.pid);
        document.removeEventListener("visibilitychange", this.reconnect);
    }

    render(){
        return <div ref={this.xtermRef} className={"terminal"} />
    }

}
