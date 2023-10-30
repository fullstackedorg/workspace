
import fs from "fs";
import { buildHTMLPage } from "./html.js";
import * as sass from "sass";
import esbuild from "esbuild";

if(fs.existsSync("dist"))
    fs.rmSync("dist", {recursive: true});

fs.mkdirSync("dist");

fs.writeFileSync("dist/index.html", buildHTMLPage());

fs.writeFileSync("dist/index.css", sass.compile("index.scss", {style: "compressed"}).css);

esbuild.buildSync({
    entryPoints: ["script.ts"],
    outfile: "dist/script.js",
    bundle: true,
    minify: true
});

[].forEach(item => fs.cpSync(item, "dist/" + item, {recursive: true}))