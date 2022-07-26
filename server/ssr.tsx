import * as React from "react";
import {ReactElement} from "react";
import {renderToString} from "react-dom/server";
import fs from "fs";

global.React = React;

export default function (component: ReactElement, filePath: string){
    fs.writeFileSync(filePath, renderToString(component));
}
