import fs from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

fs.writeFileSync(resolve(__dirname, "test-postbuild.txt"), "test postbuild");

export default async function(){
    fs.writeFileSync(resolve(__dirname, "test-postbuild-2.txt"), "test postbuild async");
}
