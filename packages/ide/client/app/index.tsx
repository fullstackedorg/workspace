import React, {useEffect} from "react";
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
import codeServer from "../icons/code-server.png";
//@ts-ignore
import docker from "../icons/docker.svg";
import {createRoot} from "react-dom/client";
import Files from "./files";
import Browser from "../browser";
import {createWinID, getWidth, winStore} from "./WinStore";
import cookie from "cookie";
import {client} from "../client";
import Docker from "../docker";
import {maybeAddToken} from "../maybeAddToken";

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
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

const winOptions = {
    x: "center",
    y: "center",
    width: getWidth()
}

export default function () {
    useEffect(initZoneSelect, [])

    return <div>
        <div className={"background"}>
            <img src={logo}/>
        </div>
        {cookie.parse(document.cookie).token && <ButtonIcon
            icon={logout}
            title={"Logout"}
            onClick={async () => {
                await client.get().logout();
                document.cookie = cookie.serialize("token", "", {
                    expires: new Date(0)
                });
                window.location.reload();
            }}
        />}
        <ButtonIcon
            icon={terminal}
            title={"Terminal"}
            onClick={() => {
                const id = createWinID();
                const winBox = new WinBox("Terminal", {
                    ...winOptions,
                    url: maybeAddToken(new URL(`${window.location.href}?terminal=1&winId=${id}`)),
                });
                winStore.set(id, winBox);
            }}
        />
        <ButtonIcon
            icon={files}
            title={"Explorer"}
            onClick={() => {
                const div = document.createElement("div");
                new WinBox("Files", {...winOptions, mount: div});
                createRoot(div).render(<Files/>);
            }}
        />
        <ButtonIcon
            icon={browser}
            title={"Browser"}
            onClick={() => {
                const id = createWinID();
                const winBox = new WinBox("Browser", {
                    ...winOptions,
                    url: maybeAddToken(new URL(`${window.location.href}?browser=1&winId=${id}`))
                });
                winStore.set(id, winBox);
            }}
        />
        <ButtonIcon
            icon={codeServer}
            title={"Code"}
            onClick={() => {
                const id = createWinID();
                const iframe = document.createElement("iframe");
                iframe.style.backgroundImage = `url(${loading})`;
                // @ts-ignore
                iframe.credentialless = true;
                const winBox = new WinBox("Code Server", {
                    ...winOptions,
                    mount: iframe
                });
                iframe.src = window.hasCredentialless
                    ? maybeAddToken(new URL(`${window.location.protocol}//${window.location.host}?winId=${id}&port=8888`))
                    : maybeAddToken(new URL(`${window.location.protocol}//8888.${window.location.host}?winId=${id}`));
                winStore.set(id, winBox);
            }}
        />
        {/*<ButtonIcon*/}
        {/*    icon={docker}*/}
        {/*    title={"Docker"}*/}
        {/*    onClick={() => {*/}
        {/*        const div = document.createElement("div");*/}
        {/*        new WinBox("Docker", {*/}
        {/*            ...winOptions,*/}
        {/*            mount: div*/}
        {/*        });*/}
        {/*        createRoot(div).render(<Docker />);*/}
        {/*    }}*/}
        {/*/>*/}
    </div>
}
