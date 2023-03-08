import React from "react";
import {createRoot} from "react-dom/client";
import App from "./react/App"

export default function main(){
    const reactDIV = document.createElement("div");
    reactDIV.setAttribute("id", "react-root");
    document.body.append(reactDIV);
    const root = createRoot(reactDIV);
    root.render(<App />);
}

main();
