import "./sw";
import {createRoot} from "react-dom/client";
import React from "react";
import App from "./app";
import "winbox/dist/css/winbox.min.css";
import "winbox/dist/css/themes/modern.min.css";
import "./index.css";
import Editor from "./editor";
import Terminal from "./terminal";
import Browser from "./browser";
import Credentialless from "./credentialless";

await Credentialless();

const url = new URL(window.location.href);

let rootDiv = document.querySelector("#root") as HTMLDivElement;
if(!rootDiv){
    rootDiv = document.createElement("div");
    rootDiv.setAttribute("id", "root");
    document.body.append(rootDiv);
}

if(url.searchParams.get("edit")){
    await Editor(url.searchParams.get("edit"));
}else if(url.searchParams.get("terminal")){
    createRoot(rootDiv).render(<Terminal />)
}else if(url.searchParams.get("browser")){
    createRoot(rootDiv).render(<Browser />)
}else{
    createRoot(rootDiv).render(<App />)
}

const winID = url.searchParams.get("winId");
if(winID){
    window.addEventListener('click', () => {
        if(window.parent?.postMessage) {
            window.parent.postMessage({winID});
        }
    });
    window.addEventListener('mousedown', () => {
        if(window.parent?.postMessage) {
            window.parent.postMessage({winID});
        }
    });
}
