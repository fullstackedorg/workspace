import CLIParser from "fullstacked/utils/CLIParser";
import {resolve} from "path";
import fs from "fs";
import {execSync} from "child_process";
import {argsSpecs} from "./args";

export default function() {
    const {projectDir, fullstackedVersion} = CLIParser.getCommandLineArgumentsValues(argsSpecs);

    if(fs.existsSync(resolve(projectDir, "package.json")))
        throw Error(`package.json already exist at [${projectDir}]`);

    if(!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, {recursive: true});

    execSync("npm init --y", {stdio: "ignore", cwd: projectDir});

    const fullstackedPackage = fs.existsSync(fullstackedVersion)
        ? fullstackedVersion
        : `fullstacked@${fullstackedVersion}`;

    execSync(`npm i ${fullstackedPackage}`, {stdio: "inherit", cwd: projectDir});
}
