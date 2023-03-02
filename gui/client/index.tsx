import "@tabler/core/dist/css/tabler.css";
import {WS} from "./WebSocket";
import {GLOBAL_CMD} from "../../types/gui";
import Deploy from "./deploy/Deploy";
import Run from "./run/Run";
import Header from "./Header";
import React from "react";
import {createRoot} from "react-dom/client";

const savedTheme = window.localStorage.getItem("theme");
if(savedTheme === "dark") document.body.classList.add("theme-dark");

const root = createRoot(document.body);

await WS.init();

const currentCommand = await WS.cmd(GLOBAL_CMD.GET_CURRENT);

let CurrentApp = <>Command {currentCommand} not implemented</>;
switch (currentCommand){
    case "Deploy":
    case "Remove":
        CurrentApp = <Deploy currentCommand={currentCommand} />;
        break;
    case "Watch":
    case "Run":
        CurrentApp = <Run />
        break;
}

root.render(<>
    <Header />
    {CurrentApp}
</>)
