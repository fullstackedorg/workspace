import fs from "fs";
import path from "path"
import defaultConfig from "./config";

const serverTemplate = `import Server from "fullstacked/server";

const server = new Server();

server.express.get("/hello-world", (req, res) => 
    res.send("Hello World"));

server.start();

export default server;
`;

const webappTemplate = `import Webapp from "fullstacked/webapp";

Webapp(<>Welcome to FullStacked!</>);
`;

const testsTemplate = `import * as assert from "assert";
import {before, describe} from "mocha";
import Helper from "fullstacked/tests/integration/Helper"
import server from "./server";
import axios from "axios";

describe("Integration", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start()
    });

    it('Should load default page', async function(){
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "Welcome to FullStacked!");
    });

    after(async function(){
        await test.stop();
    });
});

describe("End-to-End", function(){
    before(async function (){
        server.start({silent: true, testing: true});
    });

    it('Should hit endpoint', async function(){
        assert.equal("Hello World", (await axios.get("http://localhost:8000/hello-world")).data)
    });

    after(async function (){
        server.stop();
    });
});`;

export default function(config) {
    config = defaultConfig(config);

    fs.writeFileSync(path.resolve(config.src, "server.ts"), serverTemplate);
    fs.writeFileSync(path.resolve(config.src, "index.tsx"), webappTemplate);

    if(!config.noTest) {
        fs.writeFileSync(path.resolve(config.src, "test.ts"), testsTemplate);
        fs.cpSync(path.resolve(__dirname, "../.mocharc.js"), process.cwd() + "/.mocharc.js");
    }

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Starter App Created!");
}
