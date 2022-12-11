import React from "react"
import {createRoot} from "react-dom/client";
import App from "./src/App";
import LoadConfigs from "./src/LoadConfigs";
import {fetch} from "../../webapp/fetch"

export default async function (){
    const root = createRoot(document.querySelector("fullstacked-root"));

    const port = await fetch.get("/port");
    if(!port)
        return root.render(<>Cannot get local node port</>);

    const baseUrl = `http://localhost:${port}`

    const {hasSavedConfigs} = await fetch.get(`${baseUrl}/check`);

    root.render(<App baseUrl={baseUrl} hasSavedConfigs={hasSavedConfigs} />);
}
