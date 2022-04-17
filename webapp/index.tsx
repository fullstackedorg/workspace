import "./GlobalReact";
import {ReactElement} from "react";
import {render} from "react-dom";
import {sleep} from "../utils";

export default function Webapp(app: ReactElement | string) {
    const rootElement = document.getElementById("root");
    render(app, rootElement, async () => {
        await sleep(200) // dont like, must fix
        rootElement.style.opacity = "1";
    });
}
