import {describe} from "mocha";
import {execSync} from "child_process";
import fs from "fs";
import path from "path";
import Helper from "fullstacked/tests/e2e/Helper"
import {equal, ok} from "assert";

describe("Create Test", function(){
    const webAppFile = path.resolve(__dirname, "webapp.tsx");
    const serverFile = path.resolve(__dirname, "server.ts");
    const serviceWorkerFile = path.resolve(__dirname, "service-worker.ts");
    const manifestFile = path.resolve(__dirname, "manifest.json");
    let test;

    it('Should create the default starter file', function(){
        const logMessage = execSync(`node ${path.resolve(__dirname, "../../../cli")} create --src=${__dirname} --silent --skip-test`).toString();
        if(logMessage)
            console.log(logMessage);

        ok(fs.existsSync(webAppFile));
        ok(fs.existsSync(serverFile));
    });

    it('Should add the pwa minimal requirements', function (){
        const logMessage = execSync(`node ${path.resolve(__dirname, "../../../cli")} create --src=${__dirname} --silent --pwa --skip-test`).toString();
        if(logMessage)
            console.log(logMessage);

        ok(fs.existsSync(serviceWorkerFile));
        ok(fs.existsSync(manifestFile));
    });

    it('Should display the default starter app', async function (){
        test = new Helper(__dirname);
        await test.start();
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Welcome to FullStacked!");
    });

    after(async () => {
        await test.stop();

        const files = [webAppFile, serverFile, serviceWorkerFile, manifestFile];

        files.forEach(file => {
            if(fs.existsSync(file))
                fs.rmSync(file);
        });
    });
});
