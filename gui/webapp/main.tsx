import React from "react"
import {createRoot} from "react-dom/client";
import {WS} from "./WebSocket";
import {GLOBAL_CMD} from "../../types/gui";
import Deploy from "./deploy/Deploy";
import Header from "./Header";
import Run from "./run/Run";

export default async function (){
    const root = createRoot(document.querySelector("fullstacked-root"));

    await WS.init();

    const currentCommand = await WS.cmd(GLOBAL_CMD.GET_CURRENT);

    let CurrentApp = <>Command {currentCommand} not implemented</>;
    switch (currentCommand){
        case "Deploy":
            CurrentApp = <Deploy />;
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
}
