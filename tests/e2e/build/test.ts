import {describe} from "mocha";
import fs from "fs";
import path from "path";
import {execSync} from "child_process";
import {equal, ok} from "assert";
import {deleteBuiltTSFile} from "../../../scripts/utils";

describe("Build Test", function(){
    const prebuildOutputFile = path.resolve(__dirname, "prebuild.txt");
    const postbuildOutputFile = path.resolve(__dirname, "postbuild.txt");

    before(function(){
        const logMessage = execSync(`node ${path.resolve(__dirname, "../../../cli")} build --src=${__dirname} --out=${__dirname} --silent --test`).toString();
        if(logMessage)
            console.log(logMessage);
    });

    it('Should have executed prebuild', function(){
        ok(fs.existsSync(prebuildOutputFile));
        equal(fs.readFileSync(prebuildOutputFile, {encoding: "utf8"}), "prebuild");
    });

    it('Should have executed postbuild',  function (){
        ok(fs.existsSync(postbuildOutputFile));
        equal(fs.readFileSync(postbuildOutputFile, {encoding: "utf8"}), "postbuild");
    });

    after( function() {
        deleteBuiltTSFile(path.resolve(__dirname, "prebuild.ts"));
        fs.rmSync(prebuildOutputFile);
        deleteBuiltTSFile(path.resolve(__dirname, "postbuild.ts"));
        fs.rmSync(postbuildOutputFile);
        fs.rmSync(__dirname + "/dist", {force: true, recursive: true});
    });
});
