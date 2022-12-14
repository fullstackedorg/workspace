import React from "react"
import {createRoot} from "react-dom/client";
import App from "./src/App";
import {WS} from "./WebSocket";
import {DEPLOY_CMD} from "../../types/deploy";

export default async function (){
    const root = createRoot(document.querySelector("fullstacked-root"));

    await WS.init();

    const hasSavedConfigs = await WS.cmd(DEPLOY_CMD.CHECK_SAVED_CONFIG);
    
    root.render(<App hasSavedConfigs={hasSavedConfigs} />);
}
