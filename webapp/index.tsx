import "./GlobalReact";
import {ReactElement} from "react";
import {createRoot} from "react-dom/client";

export default function Webapp(app: ReactElement | string) {
    const rootElement = document.getElementById("root");
    const root = createRoot(rootElement);
    root.render(app);
}
