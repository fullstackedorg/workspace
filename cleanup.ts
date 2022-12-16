import glob from "glob";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fullstackedConfigs = glob.sync(resolve(__dirname, "**", ".fullstacked"), {ignore: "**/node_modules/**"});
const jsFiles = glob.sync(resolve(__dirname, "**", "*.js"), {ignore: "**/node_modules/**"});
const jsMapFiles = glob.sync(resolve(__dirname, "**", "*.js.map"), {ignore: "**/node_modules/**"});
const typesDeclarationFiles = glob.sync(resolve(__dirname, "**", "*.d.ts"), {ignore: "**/node_modules/**"});
const distDir = glob.sync(resolve(__dirname, "**", "dist"), {ignore: "**/node_modules/**"});
const coverageDir = glob.sync(resolve(__dirname, "**", "coverage"), {ignore: "**/node_modules/**"});

[
    ...fullstackedConfigs,
    ...jsFiles,
    ...jsMapFiles,
    ...typesDeclarationFiles,
    ...distDir,
    ...coverageDir
].forEach(file => fs.rmSync(file, {recursive: true}));


