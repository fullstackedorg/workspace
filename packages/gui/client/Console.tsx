import React, {Component, createRef} from "react";
import type {MESSAGE_TYPE} from "../WS";

export const openConsole = () => document.querySelector(".main-view").classList.add("open-console");
export const closeConsole = () => document.querySelector(".main-view").classList.remove("open-console");

export default class Console extends Component {
    static instance: Console;
    consoleRef = createRef<HTMLPreElement>();

    constructor(props) {
        super(props);
        Console.instance = this;

        const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/fullstacked-gui`);
        ws.onmessage = event => {
            this.push(JSON.parse(event.data))
        }
    }

    push(message: {data: string, type: MESSAGE_TYPE}){
        switch (message.type) {
            case "LOG":
                message.data = message.data.replace(/http\S*\b/g, url => `<a href="${url}" target="_blank">${url}</a>`);
                this.consoleRef.current.innerHTML += `<div>${message.data}</div>`;
                break;
            case "LINE":
                let lastDiv = Array.from(this.consoleRef.current.querySelectorAll("div")).at(-1);
                if(!lastDiv || !lastDiv.classList.contains("line")) {
                    lastDiv = document.createElement("div");
                    lastDiv.classList.add("line");
                    this.consoleRef.current.append(lastDiv);
                }
                lastDiv.innerText = message.data;
                break;
            case "ERROR":
                this.consoleRef.current.innerHTML += `<div class="text-danger">${message.data}</div>`;
                break;
        }

        this.consoleRef.current.scrollTo(0, this.consoleRef.current.scrollHeight);
    }

    render(){
        return <pre style={{height: "calc(100vh - 56px)", overflow: "auto", margin: 0}} ref={this.consoleRef} />
    }
}
