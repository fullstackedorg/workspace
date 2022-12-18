import fs from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

fs.writeFileSync(resolve(__dirname, "postdeploy.txt"), "postdeploy");

export default async function(){
    fs.writeFileSync(resolve(__dirname, "postdeploy-2.txt"), "postdeploy async");
}
