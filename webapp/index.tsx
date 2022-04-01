import "./global-react";
import React, {ReactElement} from "react";
import {render} from "react-dom";

export default function Webapp(app: ReactElement | string) {
    render(app, document.getElementById("root"));
}