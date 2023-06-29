import CLIParser from "fullstacked/utils/CLIParser";
import {resolve} from "path";
import fs from "fs";
import {execSync} from "child_process";
import {argsSpecs} from "./args";

export default function() {
    const {dir, tag, js} = CLIParser.getCommandLineArgumentsValues(argsSpecs);

    const packageJSONFile = resolve(dir, "package.json");
    if(fs.existsSync(packageJSONFile))
        throw `package.json already exist at [${dir}]`;

    if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});

    // web container fix
    try{
        execSync("npm init --y", {stdio: "ignore", cwd: dir});
    }catch (e) {
        execSync("npm init", {stdio: "ignore", cwd: dir});
    }

    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONFile).toString());
    packageJSONData.type = "module";
    packageJSONData.scripts = {
        start: "npx fullstacked watch"
    }
    fs.writeFileSync(packageJSONFile, JSON.stringify(packageJSONData, null, 2));

    const fullstackedPackage = fs.existsSync(tag)
        ? tag
        : `fullstacked@${tag}`;

    const packageVersion = (pkg) => fs.existsSync(tag)
        ? pkg
        : `${pkg}@${tag}`;

    execSync(["npm", "i",
        fullstackedPackage,
        packageVersion("@fullstacked/watch"),
        packageVersion("@fullstacked/webapp"),
        ...(!js
            ? [packageVersion("@fullstacked/build")]
            : [])
    ].join(" "), {stdio: "inherit", cwd: dir});

    const tsConfig = {
        "compilerOptions": {
            "module": "es2022",
            "target": "es2022",
            "moduleResolution": "node",
            "downlevelIteration": true,
            "esModuleInterop": true,
            "jsx": "react"
        }
    };

    if(!js){
        fs.writeFileSync(resolve(dir, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));
    }

    const clientDir = resolve(dir, "client");
    if(!fs.existsSync(clientDir))
        fs.mkdirSync(clientDir)
    fs.writeFileSync(resolve(clientDir, js ? "index.js" : "index.ts"), `// Client Entrypoint
let div = document.querySelector("div");
if(!div){
    div = document.createElement("div");
    document.body.append(div);
}

div.innerText = "Welcome to FullStacked";`);

    const serverDir = resolve(dir, "server");
    if(!fs.existsSync(serverDir))
        fs.mkdirSync(serverDir)
    fs.writeFileSync(resolve(serverDir, js ? "index.js" : "index.ts"), `// Server Entrypoint
import Server from "@fullstacked/webapp/server";

const server = new Server();
server.start();

export default server.serverHTTP;`);
}
