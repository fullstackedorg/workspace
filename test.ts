import {execSync} from "child_process";
import {dirname} from "path";
import fs from "fs";
import {fileURLToPath} from "url";
import * as packages from "./pack";

// cleanup test folder
const testDirectory = new URL("./test", import.meta.url);
if(fs.existsSync(testDirectory))
    fs.rmSync(testDirectory, {recursive: true});
fs.mkdirSync(testDirectory);

const relativeCreatePackageLocation = packages.createPackage.replace(dirname(fileURLToPath(import.meta.url)), "..")

// test [npm init @fullstacked]
execSync([
    "npm",
    "exec",
    relativeCreatePackageLocation,
    "--no-save",
    `--prefix ${fileURLToPath(testDirectory)}`,
    "-y",
    "--",
    `--tag ${packages.fullstackedPackage} --ts`].join(" "), {cwd: testDirectory, stdio: "inherit"});

// testing local packages
execSync(`npm i ${Object.keys(packages).map(pkg => packages[pkg]).join(" ")}`, {cwd: testDirectory, stdio: "inherit"});
