import {describe} from "mocha";
import child_process from "child_process";
import fs from "fs";
import path from "path";
import Helper from "tests/e2e/Helper"
import {sleep} from "utils";
import {equal, ok} from "assert";

describe("Create Test", function(){
    const webAppFile = path.resolve(__dirname, "index.tsx");
    const serverFile = path.resolve(__dirname, "server.ts");
    let test;

    it('Should create the default starter file', function(){
        const logMessage = child_process.execSync(`fullstacked create --src=${__dirname} --silent --no-test`).toString();
        if(logMessage)
            console.log(logMessage);

        ok(fs.existsSync(webAppFile));
        ok(fs.existsSync(serverFile));
    });

    it('Should display the default starter app', async function (){
        test = new Helper(__dirname);
        await test.start();
        await sleep(500);
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Welcome to FullStacked!");
    });

    after(async () => {
        await test.stop();

        const files = [webAppFile, serverFile];

        files.forEach(file => {
            if(fs.existsSync(file))
                fs.rmSync(file);
        });
    });
});
