import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function packPackage(location: string){
    const packageDirectory = resolve(__dirname, location);
    const packageFilename = execSync("npm pack", {cwd: packageDirectory})
        .toString()
        .split("\n")
        .filter(line => line.trim())
        .pop();
    return resolve(packageDirectory, packageFilename);
}

// pack fullstacked main package
const fullstackedPackage = packPackage(".");

function installPackageThenPack(location: string, packageToInstall: string){
    const packageDirectory = resolve(__dirname, location);
    execSync(`npm i ${packageToInstall}`, {cwd: packageDirectory})
    return packPackage(location);
}

// pack commands
installPackageThenPack("commands/build", fullstackedPackage);
installPackageThenPack("commands/run", fullstackedPackage);
installPackageThenPack("commands/watch", fullstackedPackage);

// pack create
const createPackage = installPackageThenPack("create", fullstackedPackage);

const testDirectory = resolve(__dirname, "test");
if(fs.existsSync(testDirectory))
    fs.rmSync(testDirectory, {recursive: true});
fs.mkdirSync(testDirectory);

execSync(`npm exec ${createPackage.replace(__dirname, "..")} --no-save --prefix ${testDirectory} -y -- -v ${fullstackedPackage}`, {cwd: testDirectory, stdio: "inherit"});
