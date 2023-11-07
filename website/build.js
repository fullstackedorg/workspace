
import fs from "fs";
import { buildHTMLPage } from "./html.js";
import * as sass from "sass";
import esbuild from "esbuild";

if(fs.existsSync("dist"))
    fs.rmSync("dist", {recursive: true});

fs.mkdirSync("dist/demo", {recursive: true});

fs.writeFileSync("dist/index.html", buildHTMLPage("index.html"));
fs.writeFileSync("dist/demo/index.html", buildHTMLPage("demo/index.html"));

fs.writeFileSync("dist/index.css", sass.compile("index.scss", {style: "compressed"}).css);

esbuild.buildSync({
    entryPoints: ["script.ts"],
    outfile: "dist/script.js",
    bundle: true,
    minify: true
});

esbuild.buildSync({
    entryPoints: ["demo/demo.ts"],
    outfile: "dist/demo/demo.js",
    bundle: true,
    minify: true,
    format: "esm"
});

[].forEach(item => fs.cpSync(item, "dist/" + item, {recursive: true}))
