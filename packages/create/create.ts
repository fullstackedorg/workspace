import CLIParser from "fullstacked/utils/CLIParser";
import {resolve} from "path";
import fs from "fs";
import {execSync} from "child_process";
import {argsSpecs} from "./args";
import install from "./install";

export default async function() {
    const {projectDir, fullstackedVersion, templates} = CLIParser.getCommandLineArgumentsValues(argsSpecs);

    const packageJSONFile = resolve(projectDir, "package.json");
    if(fs.existsSync(packageJSONFile))
        throw `package.json already exist at [${projectDir}]`;

    if(!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, {recursive: true});

    execSync("npm init --y", {stdio: "ignore", cwd: projectDir});

    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONFile).toString());
    packageJSONData.type = "module";
    packageJSONData.scripts = {
        start: "npx fullstacked watch"
    }
    fs.writeFileSync(packageJSONFile, JSON.stringify(packageJSONData, null, 2));

    const fullstackedPackage = fs.existsSync(fullstackedVersion)
        ? fullstackedVersion
        : `fullstacked@${fullstackedVersion}`;

    execSync(["npm", "i",
        fullstackedPackage,
        "@fullstacked/create",
        "@fullstacked/build",
        "@fullstacked/run",
        "@fullstacked/watch",
        "@fullstacked/deploy",
        "@fullstacked/backup",
        "@fullstacked/webapp",
        "@fullstacked/gui"].join(" "), {stdio: "inherit", cwd: projectDir});

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

    const clientDir = resolve(projectDir, "client");
    if(!fs.existsSync(clientDir))
        fs.mkdirSync(clientDir)
    fs.writeFileSync(resolve(clientDir, "index.ts"), `// Client Entrypoint\n`)

    const serverDir = resolve(projectDir, "server");
    if(!fs.existsSync(serverDir))
        fs.mkdirSync(serverDir)
    fs.writeFileSync(resolve(serverDir, "index.ts"), `// Server Entrypoint\nimport Server from "@fullstacked/webapp/server";\n\nexport default Server.server;\n`)

    await install();
}
