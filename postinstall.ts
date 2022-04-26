import fs from "fs";
import path from "path";

// copy axios types file to make it available to users
// should be dropped when node fetch() becomes stable
// https://nodejs.org/en/blog/announcements/v18-release-announce/#fetch-experimental

const typeFile = "index.d.ts";

let projectRootNodeModuleDir = [
    path.resolve(process.cwd(), "../../", "node_modules"),
    path.resolve(process.cwd(), "node_modules")
].filter(dir => fs.existsSync(dir));

if(projectRootNodeModuleDir.length === 0)
    throw new Error("Cannot find project root");

const axiosDir = projectRootNodeModuleDir[0] + "/axios";
const axiosTypesDir = projectRootNodeModuleDir[0] +  "/@types/axios";

if(!fs.existsSync(axiosTypesDir))
    fs.mkdirSync(axiosTypesDir, {recursive: true});

fs.cpSync(axiosDir + "/" + typeFile, axiosTypesDir + "/" + typeFile);
