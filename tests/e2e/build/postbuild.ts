import fs from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

fs.writeFileSync(resolve(__dirname, "postbuild.txt"), "postbuild");

export default async function(){
    fs.writeFileSync(resolve(__dirname, "postbuild-2.txt"), "postbuild async");
}
