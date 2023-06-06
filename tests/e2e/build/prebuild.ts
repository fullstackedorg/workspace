import fs from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

fs.writeFileSync(resolve(__dirname, "prebuild.txt"), "prebuild");

export default async function(){
    fs.writeFileSync(resolve(__dirname, "prebuild-2.txt"), "prebuild async");
}