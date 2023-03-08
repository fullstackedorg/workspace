import React from "react";
import {createRoot} from "react-dom/client";

export default function main(){
    const reactDIV = document.createElement("div");
    reactDIV.setAttribute("id", "react-root");
    document.body.append(reactDIV);

    const root = createRoot(reactDIV);
    root.render(<div>React</div>);
}

main();
