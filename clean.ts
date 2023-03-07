import {globSync} from "glob";
import fs from "fs";

const filesToRm = new Set<string>();

const options = {
    ignore: [
        "**/node_modules/**",
        "**/fullstacked-code-coverage/**"
    ]
};

const globs = [
    ".fullstacked",
    "*.js",
    "*.js.map",
    "*.d.ts",
    "dist",
    ".c8",
    ".nyc",
    ".test*",
    "coverage",
    "*.tar",
    "*.tgz",
];

globs.map(pattern => globSync(`./**/${pattern}`, {...options, nodir: true})).flat()
    .concat(globSync(`./**/`, options).filter(dir => dir && !fs.readdirSync(dir).length))
    .forEach(file => filesToRm.add(file));

filesToRm.forEach(filePath => {
    if(fs.statSync(filePath).isFile())
        fs.rmSync(filePath);
    else
        fs.rmdirSync(filePath)
});


