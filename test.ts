import {execSync} from "child_process";
import {dirname, resolve} from "path";
import fs from "fs";
import {fileURLToPath} from "url";

function packPackage(packageDirectory: string){
    const packageFilename = execSync("npm pack", {cwd: packageDirectory})
        .toString()
        .split("\n")
        .filter(line => line.trim())
        .pop();
    return resolve(packageDirectory, packageFilename);
}

// pack fullstacked main package
const fullstackedPackage = packPackage(".");

function installPackageThenPack(packageDirectory: string, packageToInstall: string){
    execSync(`npm i ${packageToInstall}`, {cwd: packageDirectory})
    return packPackage(packageDirectory);
}

// pack packages
const buildPackage  = installPackageThenPack("packages/build"   , fullstackedPackage);
const runPackage    = installPackageThenPack("packages/run"     , fullstackedPackage);
const watchPackage  = installPackageThenPack("packages/watch"   , fullstackedPackage);
const deployPackage = installPackageThenPack("packages/deploy"  , fullstackedPackage);
const backupPackage = installPackageThenPack("packages/backup"  , fullstackedPackage);
const webappPackage = installPackageThenPack("packages/webapp"  , fullstackedPackage);
const createPackage = installPackageThenPack("packages/create"  , fullstackedPackage);
const guiPackage    = installPackageThenPack("packages/gui"     , fullstackedPackage);
const idePackage    = installPackageThenPack("packages/ide"     , fullstackedPackage);

// cleanup test folder
const testDirectory = new URL("./test", import.meta.url);
if(fs.existsSync(testDirectory))
    fs.rmSync(testDirectory, {recursive: true});
fs.mkdirSync(testDirectory);

const relativeCreatePackageLocation = createPackage.replace(dirname(fileURLToPath(import.meta.url)), "..")

// test [npm init @fullstacked]
execSync([
    "npm",
    "exec",
    relativeCreatePackageLocation,
    "--no-save",
    `--prefix ${fileURLToPath(testDirectory)}`,
    "-y",
    "--",
    `-v ${fullstackedPackage}`].join(" "), {cwd: testDirectory, stdio: "inherit"});

// testing local packages
execSync(`npm i ${createPackage} ${buildPackage} ${runPackage} ${watchPackage} ${deployPackage} ${backupPackage} ${webappPackage} ${guiPackage} ${idePackage}`, {cwd: testDirectory, stdio: "inherit"});
