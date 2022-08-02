import * as React from "react";
import {ReactElement} from "react";
import {renderToString} from "react-dom/server";

global.React = React;

export default function (component: ReactElement){
    return renderToString(component);
}
