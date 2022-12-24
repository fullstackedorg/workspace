import fs from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

fs.writeFileSync(resolve(__dirname, "predeploy.txt"), "predeploy");

export default async function(){
    fs.writeFileSync(resolve(__dirname, "predeploy-2.txt"), "predeploy async");
}
