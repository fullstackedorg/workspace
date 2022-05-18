import {describe} from "mocha";
import fs from "fs";
import path from "path";
import {execSync} from "child_process";
import {equal, ok} from "assert";
import {deleteBuiltTSFile} from "../../../scripts/utils";

describe("Build Test", function(){
    const prebuildFile = path.resolve(process.cwd(), "prebuild.ts");
    const prebuildOutputFile = path.resolve(process.cwd(), "prebuild.txt");
    const postbuildFile = path.resolve(process.cwd(), "postbuild.ts");
    const postbuildOutputFile = path.resolve(process.cwd(), "postbuild.txt");

    before(function(){
        fs.copyFileSync(__dirname + "/prebuild.ts", prebuildFile);
        fs.copyFileSync(__dirname + "/postbuild.ts", postbuildFile);
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
        deleteBuiltTSFile(prebuildFile)
        fs.rmSync(prebuildOutputFile);
        deleteBuiltTSFile(postbuildFile)
        fs.rmSync(postbuildOutputFile);
        fs.rmSync(__dirname + "/dist", {force: true, recursive: true});
    });
});
