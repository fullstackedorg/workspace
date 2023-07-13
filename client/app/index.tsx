import React, {createRef, useEffect} from "react";
import WinBox from "winbox/src/js/winbox";
import ButtonIcon from "../components/button-icon";
//@ts-ignore
import loading from "../icons/loading.gif";
//@ts-ignore
import browser from "../icons/browser.svg";
//@ts-ignore
import terminal from "../icons/terminal.svg";
//@ts-ignore
import files from "../icons/files.svg";
//@ts-ignore
import logo from "../icons/fullstacked-logo.svg";
//@ts-ignore
import logout from "../icons/log-out.svg";
//@ts-ignore
import codeOSS from "../icons/code-oss.svg";
//@ts-ignore
import docker from "../icons/docker.svg";
//@ts-ignore
import stopwatch from "../icons/stopwatch.svg";
import {createRoot} from "react-dom/client";
import {openExplorer} from "./files";
import Browser from "../browser";
import {createWindow, focusWindow} from "./WinStore";
import {client} from "../client";
import Terminal from "../terminal";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import Latency from "../latency";
import Cookies from "js-cookie";
import {openCodeOSS} from "../codeOSS";


function initZoneSelect(){
    let mouseStart = null, square = null;
    const onMouseDown = (e) => {
        if(e.button !== 0) return;
        mouseStart = [e.clientX, e.clientY]
    }
    const onMouseMove = (e) => {
        if(!mouseStart) return;
        if(!square) {
            square = document.createElement("div");
            square.classList.add("select-zone");
            document.body.append(square);
        }

        const mousePos = [e.clientX, e.clientY];

        square.style.left = Math.min(mouseStart[0], mousePos[0]) + "px";
        square.style.top = Math.min(mouseStart[1], mousePos[1]) + "px";
        square.style.width = Math.abs(mouseStart[0] - mousePos[0]) + "px";
        square.style.height = Math.abs(mouseStart[1] - mousePos[1]) + "px";
    }
    const onMouseUp   = () => {
        if(square)
            square.remove();
        mouseStart = null;
        square = null;
    }
    document.querySelector(".background").addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

async function checkForPapercups(){
    const papercups = await client.get().papercups();
    if(!papercups.baseUrl) return;
    //@ts-ignore
    window.Papercups = {
        config: {
            ...papercups,
            title: 'FullStacked Cloud Support',
            subtitle: 'Ask us anything 😊',
            newMessagePlaceholder: 'Start typing...',
            primaryColor: '#3eb0de',
            greeting: 'Hi there! How can I help you?',
            customer: {},
            iconVariant: "filled",
            showAgentAvailability: true,
        },
    };
    const scriptTag = document.createElement("script");
    scriptTag.src = `${papercups.baseUrl}/widget.js`;
    document.body.append(scriptTag);
    const scriptTag2 = document.createElement("script");
    scriptTag2.src = `${papercups.baseUrl}/storytime.js`;
    document.body.append(scriptTag2);
}

export default function () {
    const [hasCodeOSS] = useAPI(client.get().hasCodeOSS);
    useEffect(initZoneSelect, []);
    useEffect(() => {checkForPapercups()}, []);


    const apps: {
        icon: string,
        title: string,
        onClick(): void,
    }[] = [
        {
            icon: terminal,
            title: "Terminal",
            onClick() {
                const div = document.createElement("div");
                const terminalRef = createRef<Terminal>();
                const {id} = createWindow("Terminal",  {
                    mount: div,
                    onclose: () => {
                        terminalRef.current.ws.close();
                    },
                    onresize: () => {
                        setTimeout(() => {terminalRef?.current?.onResize()}, 500)
                    },
                    onfullscreen: () => {
                        setTimeout(() => {terminalRef?.current?.onResize()}, 500)
                    },
                });
                createRoot(div).render(<Terminal ref={terminalRef} onFocus={() => focusWindow(id)} />);
            }
        },
        {
            icon: files,
            title: "Explorer",
            onClick(){ openExplorer() }
        },
        {
            icon: browser,
            title: "Browser",
            onClick() {
                const div = document.createElement("div");
                const { id } = createWindow("Browser", {mount: div});
                createRoot(div).render(<Browser id={id} />);
            }
        },
        {
            icon: stopwatch,
            title: "Latency",
            onClick() {
                const div = document.createElement("div");
                createWindow("Latency Test", {mount: div});
                createRoot(div).render(<Latency />);
            }
        }
    ]

    if(Cookies.get("fullstackedAccessToken")){
        apps.unshift({
            title: "Logout",
            icon: logout,
            async onClick() {
                await client.get().logout();
                window.location.href = "/?logout=1";
            }
        })
    }

    if(hasCodeOSS){
        apps.push({
            icon: codeOSS,
            title: "Code",
            onClick(){ openCodeOSS() }
        })
    }

    return <>
        <div className={"background"}>
            <img src={logo}/>
        </div>
        {apps.map((app, i) => <ButtonIcon
            icon={app.icon}
            title={app.title}
            top={i * 80}
            left={0}
            onClick={app.onClick}
        />)}
    </>
}
