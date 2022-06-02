import {before, describe} from "mocha";
import axios from "axios";
import server from "../server";
import path from "path";
import {MailingRoutes} from "./mailing";
import prerun from "../prerun";
import fs from "fs";
import {execSync} from "child_process";
import {equal, ok} from "assert";
import {cleanOutDir, silenceCommandLine} from "../../scripts/utils";
import sleep from "fullstacked/scripts/sleep";


describe("Website Integration Mailing Tests", function(){
    const outdir = path.resolve(__dirname, "dist");
    const composeFilePath = path.resolve(outdir, "docker-compose.yml");

    before(async function (){
        cleanOutDir(outdir)
        fs.mkdirSync(outdir);
        fs.cpSync(path.resolve(__dirname, "../docker-compose.yml"), composeFilePath);
        await prerun({
            name: "test",
            out: outdir,
            silent: true
        });
        execSync(silenceCommandLine(`docker-compose -p test -f ${composeFilePath} up -d`));
        await sleep(5000);
        MailingRoutes.mailingAppURL = "http://localhost:9989";
        server.start({silent: true, testing: true});
    });

    it('Should return subscribers count', async function(){
        await sleep(2000);
        const response = await axios.get("/mailing/subscribers/2");
        equal(response.status, 200);
        ok(response.data)
    });

    it('Should subscribe to mailing list', async function(){
        const response = await axios.post("/mailing/subscribe", {
            email: "hi@cplepage.com"
        });
        equal(response.status, 200);
        ok(response.data.success);
    });

    after(async function(){
        server.stop();
        execSync(silenceCommandLine(`docker-compose -p test -f ${composeFilePath} down -v -t 0`));
        cleanOutDir(outdir)
    });
});
