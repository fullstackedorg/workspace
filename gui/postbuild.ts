import fs from "fs";
import path from "path";
import {FullStackedConfig} from "../index";

export default function (config: FullStackedConfig){
    fs.cpSync(path.resolve(__dirname, "..", "node_modules", "@tabler", "core", "dist", "css", "tabler.css"), path.resolve(config.public, "tabler.css"));
}
