import "./sw";
import {createRoot} from "react-dom/client";
import React from "react";
import App from "./app";
import "winbox/dist/css/winbox.min.css";
import "winbox/dist/css/themes/modern.min.css";
import "./index.css";
import Credentialless from "./credentialless";
import {inIframe} from "./utils";
import Cookies from "js-cookie";
import {client} from "./client";

// Will need a nonce protocol to use this
// Too unsafe to put session_token in query params
// if(!inIframe())
//     await Credentialless();

let rootDiv = document.querySelector("#root") as HTMLDivElement;
if(!rootDiv){
    rootDiv = document.createElement("div");
    rootDiv.setAttribute("id", "root");
    document.body.append(rootDiv);
}

createRoot(rootDiv).render(<App />);

async function keepAccessTokenValid(){
    const accessToken = Cookies.get("fullstackedAccessToken");
    const accessTokenComponents = accessToken.split(":");
    const expiration = parseInt(accessTokenComponents.pop());

    // 2 min before expiration
    const shouldRevalidate = isNaN(expiration) || expiration <= (Date.now() + 1000 * 60 * 2);

    if(!shouldRevalidate) return;

    let response;
    try{
        response = await (await fetch("/", {method: "POST"})).text();
    }catch(e){
        console.log(e);
    }

    if(response) return;

    window.location.reload();
}


keepAccessTokenValid();
setInterval(keepAccessTokenValid, 1000);
