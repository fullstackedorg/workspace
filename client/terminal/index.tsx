import React, {Component, createRef} from "react";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { WebLinksAddon } from 'xterm-addon-web-links';
import {openCodeOSS} from "../codeOSS";
import {client} from "../client";
import GithubDeviceFlow from "./github-device-flow";
import { addApp } from "../workspace";
//@ts-ignore
import terminalIcon from "../icons/terminal.svg";

class Terminal extends Component {
    SESSION_ID: string;
    githubDeviceFlow;
    ws: WebSocket;
    xtermRef = createRef<HTMLDivElement>();
    xterm = new Xterm();
    fitAddon = new FitAddon();
    webLinks = new WebLinksAddon((e, uri) => {
        if(uri.match(/http:\/\/(localhost|0\.0\.0\.0|127\.0\.0\.1):\d+/g)){
            const url = new URL(uri);

            if(e.ctrlKey || e.metaKey){
                const div = document.createElement("div");
                // const { id } = createWindow("Browser", {mount: div});
                // createRoot(div).render(<Browser id={id} port={url.port} path={url.pathname} />);
                this.xterm.blur();
                return;
            }

            url.hostname = url.port + "." + window.location.hostname;
            url.port = window.location.port;
            url.protocol = window.location.protocol;
            uri = url.toString();
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
            (this.SESSION_ID ? `/${this.SESSION_ID}` : "");

        this.ws = new WebSocket(wsURL);

        this.ws.onopen = () => this.onResize();

        this.ws.onmessage = e => {
            if(e.data.startsWith("SESSION_ID#")){
                this.SESSION_ID = e.data.split("#").pop();
                return;
            } else if(e.data.startsWith("CODE#")){
                openCodeOSS(e.data.split("#").pop());
                this.xterm.blur();
                return;
            } 
            // else if(e.data.startsWith("OPEN#")){
            //     openExplorer(e.data.split("#").pop());
            //     this.xterm.blur();
            //     return;
            // }
            else if(e.data.startsWith("GITHUB_DEVICE_FLOW#")){
                const [_, verification_uri, device_code] = e.data.split("#");

                // const mount = document.createElement("div");
                // this.githubDeviceFlow = createWindow("GitHub Auth", {mount});
                // createRoot(mount).render(<GithubDeviceFlow
                //     verificationUri={verification_uri}
                //     deviceCode={device_code}
                // />)
                // focusWindow(this.githubDeviceFlow.id);

                return;
            }else if(this.githubDeviceFlow && e.data === "GITHUB_DEVICE_FLOW_DONE"){
                this.githubDeviceFlow.winBox.close();
                this.githubDeviceFlow = null;
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
            }else if(key === '\x0b'){
                window.dispatchEvent(domEvent);
                return;
            }
            
            // let debugBinaryValues = [];
            // for (var i = 0; i < key.length; i++) {
            //     debugBinaryValues.push(key[i].charCodeAt(0).toString(16));
            // }
            // console.log(debugBinaryValues)

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
        await client.post().killTerminalSession(this.SESSION_ID);
        document.removeEventListener("visibilitychange", this.reconnect);
    }

    render(){
        return <div ref={this.xtermRef} className={"terminal"} />
    }
}

addApp({
    title: "Terminal",
    icon: terminalIcon,
    element: (win) => {
        const terminalRef = createRef<Terminal>();
        win.callbacks = {
            onWindowResize: () => terminalRef.current.onResize()
        }
        return <Terminal ref={terminalRef} />
    }
})