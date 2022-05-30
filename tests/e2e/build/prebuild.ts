import fs from "fs";

fs.writeFileSync(__dirname + "/prebuild.txt", "prebuild");

export default async function(){
    fs.writeFileSync(__dirname + "/prebuild-2.txt", "prebuild async");
}
