import "./sw";
import {createRoot} from "react-dom/client";
import React, { createRef } from "react";
import "./index.css";
import Cookies from "js-cookie";
import {Workspace} from "./workspace";
import CommandPalette from "./commandPalette";
import logo from "./icons/fullstacked-logo.svg";
import {client} from "./client";
import logoutIcon from "./icons/log-out.svg";

(() => {
    const hasAuth = hasAuthToken();

    if(hasAuth){
        if(hasLogoutFlag()){
            return logout();
        }else{
            addLogoutIcon();

            keepAccessTokenValid();
            setInterval(keepAccessTokenValid, 1000);
        }
    }

    preventRefreshKeyBinding();
    setBackground();

    main();
})()

function hasAuthToken(){
    return Cookies.get("fullstackedAccessToken")
}

function hasLogoutFlag(){
    const url = new URL(window.location.href);
    return !!url.searchParams.get("logout");
}

async function logout(){
    await client.get().logout();
    window.location.href = "/?logout=1";
}

function addLogoutIcon(){
    Workspace.apps.push({
        title: "Logout",
        order: 100,
        icon: logoutIcon,
        element: () => {
            logout();
            return <div className={"logout"}>Logging out...</div>
        }
    });
}

function preventRefreshKeyBinding(){
    window.addEventListener("keydown", e => {
        if(e.key === "r" && (e.metaKey || e.ctrlKey))
            e.preventDefault();
    });
}

function setBackground(){
    document.body.style.backgroundImage = `url(${logo})`;
}

async function main(){
    let rootDiv = document.querySelector("#root") as HTMLDivElement;
    if(!rootDiv){
        rootDiv = document.createElement("div");
        rootDiv.setAttribute("id", "root");
        document.body.append(rootDiv);
    }

    const commandPaletteRef = createRef<CommandPalette>();
    createRoot(rootDiv).render(<>
        <CommandPalette ref={commandPaletteRef} />
        <Workspace />
    </>);

    await import("./terminal");
    await import("./explorer");
    await import("./browser");
    await import("./latency");
    await import("./codeOSS");

    commandPaletteRef.current.setState({show: true});
}

async function keepAccessTokenValid(){
    const accessToken = Cookies.get("fullstackedAccessToken");
    if(!accessToken) return;
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
