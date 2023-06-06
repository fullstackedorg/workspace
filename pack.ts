import {execSync} from "child_process";
import {resolve} from "path";

function packPackage(packageDirectory: string){
    const packageFilename = execSync("npm pack", {cwd: packageDirectory})
        .toString()
        .split("\n")
        .filter(line => line.trim())
        .pop();
    return resolve(packageDirectory, packageFilename);
}

// pack fullstacked main package
export const fullstackedPackage = packPackage(".");

function installPackageThenPack(packageDirectory: string, packageToInstall: string){
    execSync(`npm i ${packageToInstall}`, {cwd: packageDirectory})
    return packPackage(packageDirectory);
}

// pack packages
export const buildPackage  = installPackageThenPack("packages/build"   , fullstackedPackage);
export const runPackage    = installPackageThenPack("packages/run"     , fullstackedPackage);
export const watchPackage  = installPackageThenPack("packages/watch"   , fullstackedPackage);
export const deployPackage = installPackageThenPack("packages/deploy"  , fullstackedPackage);
export const backupPackage = installPackageThenPack("packages/backup"  , fullstackedPackage);
export const webappPackage = installPackageThenPack("packages/webapp"  , fullstackedPackage);
export const createPackage = installPackageThenPack("packages/create"  , fullstackedPackage);
export const guiPackage    = installPackageThenPack("packages/gui"     , fullstackedPackage);
export const idePackage    = installPackageThenPack("packages/ide"     , fullstackedPackage);
