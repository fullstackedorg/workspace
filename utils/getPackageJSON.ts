// get package json data from package.json at project root
import path from "path";
import fs from "fs";

export default function getPackageJSON():{[key:string]: any} {
    const packageJSONPath = path.resolve(process.cwd(), "package.json");
    if(!fs.existsSync(packageJSONPath))
        throw Error("Cannot find package.json file. Please run fullstacked commands at your project root");

    return JSON.parse(fs.readFileSync(packageJSONPath, {encoding: "utf-8"}));
}
