import "./GlobalReact";
import {ReactElement} from "react";
import {createRoot} from "react-dom/client";

export default function render(app: ReactElement | string, rootElementID: string = "root") {
    const rootElement = document.getElementById(rootElementID);
    if(!rootElement) return;
    const root = createRoot(rootElement);
    root.render(app);
}
