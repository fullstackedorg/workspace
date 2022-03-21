import React, {ReactElement} from "react";
import {render} from "react-dom";

export default function webapp(app: ReactElement | string) {
    render(app, document.getElementById("root"));
}
