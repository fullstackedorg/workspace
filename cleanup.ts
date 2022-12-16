import glob from "glob";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const jsFiles = glob.sync(resolve(__dirname, "**", "*.js"), {ignore: "**/node_modules/**"});
const jsMapFiles = glob.sync(resolve(__dirname, "**", "*.js.map"), {ignore: "**/node_modules/**"});

jsFiles.concat(jsMapFiles).forEach(file => fs.rmSync(file));


