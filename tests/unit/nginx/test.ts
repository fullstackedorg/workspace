import {getServerNamesConfigs, setupNginxFile} from "../../../scripts/deploy";
import {deepEqual, equal} from "assert";
import path from "path";
import fs from "fs";

describe("Test nginx generation", function(){
    const nginxFile = path.resolve(__dirname, "nginx.conf");
    const serverNameFile = path.resolve(__dirname, ".server-names");

    before(function(){
        fs.copyFileSync(path.resolve(__dirname, "server-names-template.json"), serverNameFile);
    })
    it("Should generate nginx cong correctly", async function (){
        const portsMap = new Map([
            ["node", ["8000:80"]],
            ["mongodb", ["8001:27017"]],
            ["some-service", ["8002:9000", "8003:9001"]]
        ]);
        await setupNginxFile(nginxFile, serverNameFile, "test", "0.0.0", portsMap);
        deepEqual(fs.readFileSync(nginxFile), fs.readFileSync(path.resolve(__dirname, "nginx-result.conf")));
        deepEqual(JSON.parse(fs.readFileSync(serverNameFile, {encoding: "utf-8"})),
            JSON.parse(fs.readFileSync(path.resolve(__dirname, "server-names-template.json"), {encoding: "utf-8"})));
    });

    after(function (){
        fs.rmSync(nginxFile);
        fs.rmSync(serverNameFile);
    })
})
