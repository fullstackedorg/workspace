import path from "path";
import fs from "fs";

export function getPackageJSON(projectRoot){
    const possibleLocation = [
        path.resolve(projectRoot, "package.json"),
        path.resolve(process.cwd(), projectRoot, "package.json"),
        path.resolve(process.cwd(), projectRoot)
    ];

    let packageJSONFile = "";
    for (let i = 0; i < possibleLocation.length; i++) {
        if(fs.existsSync(possibleLocation[i]) && possibleLocation[i] !== "/package.json") {
            packageJSONFile = possibleLocation[i];
            break;
        }
    }

    if(!packageJSONFile)
        return {};

    return JSON.parse(fs.readFileSync(packageJSONFile, {encoding: "utf-8"}));
}
