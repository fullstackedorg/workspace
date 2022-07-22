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
import HelperIntegration from "fullstacked/tests/integration/Helper";
import server from "./server";
import axios from "axios";

HelperIntegration(
    describe("Hello World", function(){
        before(async function (){
            server.start({silent: true, testing: true})
        });

        it('Should hit hello world endpoint', async function(){
            const response = await axios.get("/hello-world");
            equal(response.data, "Hello World");
        });

        it('Should hit hello world endpoint failing', async function(){
            const response = await axios.get("/hello-world");
            equal(response.data, "Hello World2");
        });

        after(async function(){
            server.stop();
        });
    })
);

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
    const webAppFilePath = path.resolve(config.src, "webapp.tsx");
    if(!fs.existsSync(webAppFilePath)) fs.writeFileSync(webAppFilePath, webAppTemplate);

    if(!config.skipTest) {
        fs.writeFileSync(path.resolve(config.src, "test.ts"), testsTemplate);
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
