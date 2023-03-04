import CLIParser from "fullstacked/utils/CLIParser";
import {dirname, resolve} from "path";
import fs from "fs";
import {execSync} from "child_process";
import {fileURLToPath} from "url";
import {argsSpecs} from "./args";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function() {
    const {projectDir, fullstackedVersion} = CLIParser.getCommandLineArgumentsValues(argsSpecs);

    if(fs.existsSync(resolve(projectDir, "package.json")))
        throw Error(`package.json already exist at [${projectDir}]`);

    if(!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, {recursive: true});

    execSync("npm init --y", {stdio: "ignore", cwd: projectDir});

    const fullstackedPackage = fs.existsSync(resolve(__dirname, fullstackedVersion))
        ? fullstackedVersion
        : `fullstacked@${fullstackedVersion}`;

    execSync(`npm i ${fullstackedPackage}`, {stdio: "inherit", cwd: projectDir});
}
