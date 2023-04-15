import React, {useEffect} from "react";
import WinBox from "winbox/src/js/winbox";
import ButtonIcon from "../components/button-icon";
//@ts-ignore
import browser from "../icons/browser.svg";
//@ts-ignore
import terminal from "../icons/terminal.svg";
//@ts-ignore
import files from "../icons/files.svg";
//@ts-ignore
import logo from "../icons/fullstacked-logo.svg";
import {createRoot} from "react-dom/client";
import Files from "./files";
import Browser from "../browser";
import {createWinID, winStore} from "./WinStore";

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

export default function () {
    useEffect(initZoneSelect, [])

    return <div>
        <div className={"background"}>
            <img src={logo} />
        </div>
        <ButtonIcon
            icon={terminal}
            title={"Terminal"}
            onClick={() => {
                const id = createWinID();
                const winBox = new WinBox("Terminal", {url: `${window.location.href}?terminal=1&winId=${id}`});
                winStore.set(id, winBox);
            }}
        />
        <ButtonIcon
            icon={files}
            title={"Explorer"}
            onClick={() => {
                const div = document.createElement("div");
                new WinBox("Files", { mount: div });
                createRoot(div).render(<Files />);
            }}
        />
        <ButtonIcon
            icon={browser}
            title={"Browser"}
            onClick={() => {
                const id = createWinID();
                const winBox = new WinBox("Browser", { url: `${window.location.href}?browser=1&winId=${id}` });
                winStore.set(id, winBox);
            }}
        />
    </div>
}
