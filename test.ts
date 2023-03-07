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

// pack commands
const buildPackage = installPackageThenPack("commands/build", fullstackedPackage);
const runPackage = installPackageThenPack("commands/run", fullstackedPackage);
const watchPackage = installPackageThenPack("commands/watch", fullstackedPackage);
const deployPackage = installPackageThenPack("commands/deploy", fullstackedPackage);
const backupPackage = installPackageThenPack("commands/backup", fullstackedPackage);

// pack create
const createPackage = installPackageThenPack("create", fullstackedPackage);

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

// testing [npm i @fullstacked/build @fullstacked/run @fullstacked/watch @fullstacked/deploy @fullstacked/backup]
execSync(`npm i ${buildPackage} ${runPackage} ${watchPackage} ${deployPackage} ${backupPackage}`, {cwd: testDirectory, stdio: "inherit"});
