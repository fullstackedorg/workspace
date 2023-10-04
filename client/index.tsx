import "./sw";
import "./index.css";
import {createRoot} from "react-dom/client";
import React, {useEffect} from "react";
import Cookies from "js-cookie";
import {Workspace} from "./workspace";
import CommandPalette from "./commandPalette";
import logo from "./icons/fullstacked-logo.svg";
import {client} from "./client";
import logoutIcon from "./icons/log-out.svg";
import {Sync} from "./sync";
import {AuthFlow} from "./explorer/cloud";
import Merge from "./editor/merge";

(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if(searchParams.get("auth")){
        renderAuthFlow(searchParams.get("auth"));
        return;
    }

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

function LogoutComponent(){
    useEffect(() => {
        logout()
    }, []);

    return <div className={"logout"}>Logging out...</div>
}

function addLogoutIcon(){
    Workspace.addApp({
        title: "Logout",
        order: 100,
        icon: logoutIcon,
        element: () => {
            return <LogoutComponent />
        }
    });
}

function setBackground(){
    document.body.style.backgroundImage = `url(${logo})`;
}

function renderAuthFlow(url){
    let rootDiv = document.querySelector("#root") as HTMLDivElement;
    if(!rootDiv){
        rootDiv = document.createElement("div");
        rootDiv.setAttribute("id", "root");
        document.body.append(rootDiv);
    }

    createRoot(rootDiv).render(<AuthFlow url={url} didAuthenticate={() => {
        window.close()
    }}/>)
}

async function main(){
    let rootDiv = document.querySelector("#root") as HTMLDivElement;
    if(!rootDiv){
        rootDiv = document.createElement("div");
        rootDiv.setAttribute("id", "root");
        document.body.append(rootDiv);
    }

    createRoot(rootDiv).render(<Workspace />);

    Sync.init();

    [import("./terminal"),
    import("./explorer"),
    import("./browser"),
    import("./latency"),
    import("./codeOSS")]
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
