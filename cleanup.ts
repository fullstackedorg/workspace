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
const c8Dir = glob.sync(resolve(__dirname, "**", ".c8"), {ignore: "**/node_modules/**"});
const nycDir = glob.sync(resolve(__dirname, "**", ".nyc"), {ignore: "**/node_modules/**"});
const coverageDir = glob.sync(resolve(__dirname, "**", "coverage"), {ignore: "**/node_modules/**"});
const tarFiles = glob.sync(resolve(__dirname, "**", "*.tar"), {ignore: "**/node_modules/**"});
const emptyDirs = glob.sync(resolve(__dirname, "**") + "/").filter(dir => !fs.readdirSync(dir).length);

[
    ...fullstackedConfigs,
    ...jsFiles,
    ...jsMapFiles,
    ...typesDeclarationFiles,
    ...distDir,
    ...c8Dir,
    ...nycDir,
    ...coverageDir,
    ...tarFiles,
    ...emptyDirs
].forEach(file => fs.rmSync(file, {recursive: true}));


