const fs = require("fs");
const path = require("path");

const serverTemplate = `import Server from "fullstacked/server";

new Server().start();
`;

const webappTemplate = `import * as React from 'react';
import webapp from "fullstacked/webapp";

webapp(<div>Welcome to FullStacked!</div>);
`;

module.exports = function(config){
    config = require("./config")(config);

    fs.writeFileSync(path.resolve(config.src, "server.ts"), serverTemplate);
    fs.writeFileSync(path.resolve(config.src, "index.tsx"), webappTemplate);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Starter App Created!");
}
