import {EditorView} from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import {linter} from "@codemirror/lint";
import {autocompletion, CompletionContext} from "@codemirror/autocomplete";
import {createRoot} from "react-dom/client";
import React from "react";
import App from "./app";
import "winbox/dist/css/winbox.min.css";
import "winbox/dist/css/themes/modern.min.css";
import "./index.css";
import Editor from "./editor";
import Terminal from "./terminal";


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
}else{
    createRoot(rootDiv).render(<App />)
}


