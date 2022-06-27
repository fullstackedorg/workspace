import "./GlobalReact";
import {ReactElement} from "react";
import {createRoot} from "react-dom/client";

export default function Webapp(app: ReactElement | string, rootElementID: string = "root") {
    const rootElement = document.getElementById(rootElementID);
    const root = createRoot(rootElement);
    root.render(app);
}
