import fs from "fs";
import path from "path";

fs.writeFileSync(__dirname + "/postbuild.txt", "postbuild");

export default async function(){
    fs.writeFileSync(__dirname + "/postbuild-2.txt", "postbuild async");
}
