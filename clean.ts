import glob from "fast-glob";
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
    "*.mjs",
    "*.js.map",
    "*.mjs.map",
    "*.d.ts",
    "dist",
    ".c8",
    ".nyc",
    ".test*",
    "coverage",
    "*.tar",
    "*.tgz",
];

globs.map(pattern => glob.sync(`./**/${pattern}`, {...options})).flat()
    .forEach(file => filesToRm.add(file));

filesToRm.forEach(filePath => {
    fs.rmSync(filePath, {recursive: true});
});


