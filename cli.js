#!/usr/bin/env node
let sourceRoot = "";

const srcArg = "--src=";
process.argv.forEach(arg => {

    if(arg.startsWith(srcArg))
        sourceRoot = arg.slice(srcArg.length);

});

require("./Build/build")({
    src: sourceRoot
});
