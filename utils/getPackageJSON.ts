// get package json data from package.json at project root
import path from "path";
import fs from "fs";

export default function getPackageJSON(root = process.cwd()):{[key:string]: any} {
    const packageJSONPath = path.resolve(root, "package.json");
    if(!fs.existsSync(packageJSONPath))
        throw Error("Cannot find package.json file. Please run fullstacked commands at your project root");

    return JSON.parse(fs.readFileSync(packageJSONPath, {encoding: "utf-8"}));
}
