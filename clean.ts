import glob from "glob";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

globs.map(pattern => glob.sync(resolve(__dirname, "**", pattern), options)).flat()
    .concat(glob.sync(resolve(__dirname, "**") + "/", options).filter(dir => !fs.readdirSync(dir).length))
    .forEach(file => filesToRm.add(file));

filesToRm.forEach(file => {
    if(fs.existsSync(file)) fs.rmSync(file, {recursive: true})
});


