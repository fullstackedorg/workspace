import fs from "fs";

fs.writeFileSync(__dirname + "/postdeploy.txt", "postdeploy");

export default async function(){
    fs.writeFileSync(__dirname + "/postdeploy-2.txt", "postdeploy async");
}
