import glob from "fast-glob";
import {readFileSync, writeFileSync} from "fs";

const currentFullStackedVersion = JSON.parse(readFileSync("package.json").toString()).version;

const packageJSONs = glob.sync("packages/*/package.json");

packageJSONs.forEach(packageJSONFile => {
    const packageJSON = JSON.parse(readFileSync(packageJSONFile).toString());
    packageJSON.dependencies.fullstacked = `^${currentFullStackedVersion}`;
    writeFileSync(packageJSONFile, JSON.stringify(packageJSON, null, 2));
})
