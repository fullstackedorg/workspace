import {execSync} from "child_process";
import {resolve} from "path";
import {readFileSync, rmSync, writeFileSync} from "fs";

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

function installPackageInPackage(packageDirectory: string, packageToInstall: string, dev?: boolean){
    execSync(`npm i ${packageToInstall} ${dev ? "-D" : ""}`, {cwd: packageDirectory, stdio: "inherit"});
}

function installPackageThenPack(packageDirectory: string, packageToInstall: string){
    installPackageInPackage(packageDirectory, packageToInstall);
    return packPackage(packageDirectory);
}

function removePackages(packageLocation: string, packages: string[]){
    const packageJSON = JSON.parse(readFileSync(packageLocation + "/package.json").toString());
    packages.forEach(packageName => {
        delete packageJSON.devDependencies[packageName];
        delete packageJSON.dependencies[packageName];
    });
    writeFileSync(packageLocation + "/package.json", JSON.stringify(packageJSON, null, 2));
    rmSync(packageLocation + "/node_modules", {recursive: true});
    rmSync(packageLocation + "/package-lock.json");
}

// pack packages
export const buildPackage  = installPackageThenPack("packages/build"   , fullstackedPackage);
export const runPackage    = installPackageThenPack("packages/run"     , fullstackedPackage);
export const watchPackage  = installPackageThenPack("packages/watch"   , fullstackedPackage);
export const deployPackage = installPackageThenPack("packages/deploy"  , fullstackedPackage);
export const backupPackage = installPackageThenPack("packages/backup"  , fullstackedPackage);
export const webappPackage = installPackageThenPack("packages/webapp"  , fullstackedPackage);
export const createPackage = installPackageThenPack("packages/create"  , fullstackedPackage);

// gui
const guiLocation = "packages/gui";
removePackages(guiLocation, [
    "@fullstacked/build",
    "@fullstacked/deploy",
    "@fullstacked/watch",
    "@fullstacked/webapp"
]);
installPackageInPackage(guiLocation, buildPackage, true);
installPackageInPackage(guiLocation, deployPackage, true);
installPackageInPackage(guiLocation, watchPackage, true);
installPackageInPackage(guiLocation, webappPackage, true);
export const guiPackage = installPackageThenPack(guiLocation, fullstackedPackage);

// ide
const ideLocation = "packages/ide";
removePackages(ideLocation, [
    "@fullstacked/build",
    "@fullstacked/watch",
    "@fullstacked/webapp"
]);
installPackageInPackage(ideLocation, buildPackage, true);
installPackageInPackage(ideLocation, watchPackage, true);
installPackageInPackage(ideLocation, webappPackage, true);
export const idePackage = installPackageThenPack(ideLocation, fullstackedPackage);
