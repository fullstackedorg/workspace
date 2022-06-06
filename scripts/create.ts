import fs from "fs";
import path from "path"
import defaultConfig from "./config";

const serverTemplate = `import Server from "fullstacked/server";

const server = new Server();

server.express.get("/hello-world", 
    (req, res) => res.send("Hello World"));

server.start();

export default server;
`;

const webAppTemplate = `import Webapp from "fullstacked/webapp";

Webapp(<>Welcome to FullStacked!</>);
`;

const testsTemplate = `import * as assert from "assert";
import {before, describe} from "mocha";
import Helper from "fullstacked/tests/e2e/Helper";
import server from "./server";
import axios from "axios";

describe("Integration", function(){
    before(async function (){
        server.start({silent: true, testing: true});
    });

    it('Should hit endpoint', async function(){
        assert.equal((await axios.get("/hello-world")).data, "Hello World");
    });

    after(async function (){
        server.stop();
    });
});

describe("End-2-End", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start();
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
});`;

export default function(config: Config) {
    config = defaultConfig(config);

    // output template files at project src for server
    const serverFilePath = path.resolve(config.src, "server.ts");
    if(!fs.existsSync(serverFilePath)) fs.writeFileSync(serverFilePath, serverTemplate);

    // output template files at project src for web app
    const webAppFilePath = path.resolve(config.src, "index.tsx");
    if(!fs.existsSync(webAppFilePath)) fs.writeFileSync(webAppFilePath, webAppTemplate);

    if(!config.skipTest) {
        fs.writeFileSync(path.resolve(config.src, "test.ts"), testsTemplate);

        // copy this files for to enable JetBrain WebStorm IDE test panel
        if(!fs.existsSync(process.cwd() + "/.mocharc.js"))
            fs.cpSync(path.resolve(__dirname, "../.mocharc.js"), process.cwd() + "/.mocharc.js");
    }

    // pwa minimal setup
    if(config.pwa){
        const defaultValues = {
            icons: [],
            name: config.title,
            short_name: config.name,
            display: "standalone",
            start_url: "/",
            description: "",
            background_color: "#FFF",
            theme_color: "#FFF"
        }
        fs.writeFileSync(path.resolve(config.src, "manifest.json"), JSON.stringify(defaultValues, null, 2));

        const serviceWorkerTemplate =`self.addEventListener('fetch', (event) => {});`;
        fs.writeFileSync(path.resolve(config.src, "service-worker.ts"), serviceWorkerTemplate);
    }

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Starter App Created!");
}
