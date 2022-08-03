import fs from "fs";
import ssr from "../../../server/ssr";
import path from "path";

fs.writeFileSync(__dirname + "/postbuild.txt", "postbuild");

export default async function(){
    fs.writeFileSync(__dirname + "/postbuild-2.txt", "postbuild async");
    fs.writeFileSync(path.resolve(__dirname, "ssr.html"), ssr(<div />));
}
