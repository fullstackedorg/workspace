import "./globalReact";
import {ReactElement} from "react";
import {render} from "react-dom";

export default function Webapp(app: ReactElement | string) {
    render(app, document.getElementById("root"));
}
