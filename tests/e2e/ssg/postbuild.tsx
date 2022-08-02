import {FullStackedConfig} from "../../../index";
import ssr from "../../../server/ssr";
import RenderToString from "./RenderToString";
import fs from "fs";
import path from "path";

export default function (config: FullStackedConfig) {
    fs.writeFileSync(path.resolve(config.public, "home.html"), ssr(<RenderToString />));
}
