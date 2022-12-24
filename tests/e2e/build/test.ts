import fs from "fs";
import path, {dirname} from "path";
import {execSync} from "child_process";
import {equal, ok} from "assert";
import {cleanOutDir} from "../../../utils/utils";
import {describe, it, before, after} from 'mocha';
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Build Test", function(){
    const prebuildOutputFile = path.resolve(__dirname, "prebuild.txt");
    const prebuildAsyncOutputFile = path.resolve(__dirname, "prebuild-2.txt");
    const postbuildOutputFile = path.resolve(__dirname, "postbuild.txt");
    const postbuildAsyncOutputFile = path.resolve(__dirname, "postbuild-2.txt");
    const testPostbuildOutputFile = path.resolve(__dirname, "test-postbuild.txt");
    const testPostbuildAsyncOutputFile = path.resolve(__dirname, "test-postbuild-2.txt");

    before(function(){
        const logMessage = execSync(`node ${path.resolve(__dirname, "../../../cli")} build --src=${__dirname} --out=${__dirname} --silent --test-mode`).toString();
        if(logMessage)
            console.log(logMessage);
    });

    it('Should have executed prebuild', function(){
        ok(fs.existsSync(prebuildOutputFile));
        equal(fs.readFileSync(prebuildOutputFile, {encoding: "utf8"}), "prebuild");
    });

    it('Should have awaited default export prebuild', function(){
        ok(fs.existsSync(prebuildAsyncOutputFile));
        equal(fs.readFileSync(prebuildAsyncOutputFile, {encoding: "utf8"}), "prebuild async");
    });

    it('Should have executed postbuild',  function (){
        ok(fs.existsSync(postbuildOutputFile));
        equal(fs.readFileSync(postbuildOutputFile, {encoding: "utf8"}), "postbuild");
    });

    it('Should have awaited default export postbuild', function(){
        ok(fs.existsSync(postbuildAsyncOutputFile));
        equal(fs.readFileSync(postbuildAsyncOutputFile, {encoding: "utf8"}), "postbuild async");
    });

    it('Should have executed test postbuild',  function (){
        ok(fs.existsSync(testPostbuildOutputFile));
        equal(fs.readFileSync(testPostbuildOutputFile, {encoding: "utf8"}), "test postbuild");
    });

    it('Should have awaited default export test postbuild', function(){
        ok(fs.existsSync(testPostbuildAsyncOutputFile));
        equal(fs.readFileSync(testPostbuildAsyncOutputFile, {encoding: "utf8"}), "test postbuild async");
    });

    after( function() {
        fs.rmSync(prebuildOutputFile);
        fs.rmSync(prebuildAsyncOutputFile);
        fs.rmSync(postbuildOutputFile);
        fs.rmSync(postbuildAsyncOutputFile);
        fs.rmSync(testPostbuildOutputFile);
        fs.rmSync(testPostbuildAsyncOutputFile);
        cleanOutDir(path.resolve(__dirname, "dist"));
    });
});
