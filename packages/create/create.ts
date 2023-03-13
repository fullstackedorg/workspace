import CLIParser from "fullstacked/utils/CLIParser";
import {resolve} from "path";
import fs from "fs";
import {execSync} from "child_process";
import {argsSpecs} from "./args";
import install from "./install";

export default async function() {
    const {projectDir, fullstackedVersion, templates} = CLIParser.getCommandLineArgumentsValues(argsSpecs);

    if(fs.existsSync(resolve(projectDir, "package.json")))
        throw Error(`package.json already exist at [${projectDir}]`);

    if(!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, {recursive: true});

    execSync("npm init --y", {stdio: "ignore", cwd: projectDir});

    const fullstackedPackage = fs.existsSync(fullstackedVersion)
        ? fullstackedVersion
        : `fullstacked@${fullstackedVersion}`;

    execSync(`npm i ${fullstackedPackage}`, {stdio: "inherit", cwd: projectDir});

    const tsConfig = {
        "compilerOptions": {
            "module": "es2022",
            "target": "es2022",
            "moduleResolution": "node",
            "esModuleInterop": true,
            "jsx": "react"
        }
    };

    fs.writeFileSync(resolve(projectDir, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));

    await install(templates, projectDir);
}
