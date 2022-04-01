import fs from "fs";
import path from "path"
import defaultConfig from "./config";

const serverTemplate = `import Server from "fullstacked/server";

const server = new Server();

server.start();
`;

const webappTemplate = `import Webapp from "fullstacked/webapp";

Webapp(<div>Welcome to FullStacked!</div>);
`;

export default function(config) {
    config = defaultConfig(config);

    fs.writeFileSync(path.resolve(config.src, "server.ts"), serverTemplate);
    fs.writeFileSync(path.resolve(config.src, "index.tsx"), webappTemplate);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Starter App Created!");
}
