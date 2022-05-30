import fs from "fs";

fs.writeFileSync(__dirname + "/predeploy.txt", "predeploy");

export default async function(){
    fs.writeFileSync(__dirname + "/predeploy-2.txt", "predeploy async");
}
