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

globs.map(pattern => globSync(`./**/${pattern}`, {...options})).flat()
    .forEach(file => filesToRm.add(file));

filesToRm.forEach(filePath => {
    fs.rmSync(filePath, {recursive: true});
});


