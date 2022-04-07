import path from "path"
import esbuild, {Format, Loader, Platform} from "esbuild";
import fs from "fs";
import {execSync} from "child_process";
import {getPackageJSON} from "./utils";
import crypto from "crypto";
import {glob} from "glob";

function loadEnvVars(){
    const pathENV = path.resolve(process.cwd() + "/.env");

    if(!fs.existsSync(pathENV))
        return

    require('dotenv').config({
        path: pathENV
    });
}

function getProcessEnv(){
    let processEnv = {};
    Object.keys(process.env).forEach(envKey => {
        if(envKey.includes("(") || envKey.includes(")"))
            return;

        processEnv['process.env.' + envKey] = "'" + escape(process.env[envKey].trim()) + "'";
    });

    return processEnv;
}

function cleanOutDir(dir){
    fs.rmSync(dir, {force: true, recursive: true});
}

async function buildServer(config){
    const options = {
        entryPoints: [ config.src + "/server.ts" ],
        outfile: config.out + "/index.js",
        platform: "node" as Platform,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
        plugins: [],

        define: getProcessEnv(),

        watch: config.watcher ? {
            onRebuild: async function(error, result){
                if (error) console.error('Server build failed:', error)
                config.watcher();
            }
        } : false
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Server Built");
}

async function buildWebApp(config){
    const publicDir = config.out + "/public";

    const options = {
        entryPoints: [ config.src + "/index.tsx" ],
        outdir: publicDir,
        format: "esm" as Format,
        splitting: true,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',

        define: getProcessEnv(),

        publicPath: config.publicPath,
        loader: {
            ".png": "file" as Loader
        },

        watch: config.watcher ? {
            onRebuild: async function(error, result){
                if (error) console.error('WebApp build failed:', error)
                config.watcher(true);
            }
        } : false
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    const packageConfigs = await getPackageJSON(config.root);

    const indexHTML = path.resolve(__dirname, "../webapp/index.html");
    const indexHTMLContent = fs.readFileSync( indexHTML, {encoding: "utf-8"});
    let indexHTMLContentUpdated = indexHTMLContent.replace("{TITLE}",
        packageConfigs.title ?? packageConfigs.name ?? "New Webapp");

    const versionString = (packageConfigs.version ?? "") + "-" +
        crypto.randomBytes(4).toString('hex').toUpperCase();
    indexHTMLContentUpdated = indexHTMLContentUpdated.replace("{VERSION}", versionString);

    if(config.watcher){
        const watcherScript = execSync(`esbuild ${path.resolve(__dirname, "../webapp/watcher.ts")} --minify`).toString();
        const closingBodyIndex = indexHTMLContentUpdated.indexOf("</body>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingBodyIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingBodyIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<script>${watcherScript}</script>` + postHTML;
    }

    const faviconFiles = glob.sync(config.src + "**/favicon.png");
    if(faviconFiles.length){
        fs.copyFileSync(faviconFiles[0], publicDir + "/favicon.png");
        const closingHeadIndex = indexHTMLContentUpdated.indexOf("</head>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingHeadIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingHeadIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<link rel="icon" href="/favicon.png">` + postHTML;
    }

    fs.mkdirSync(publicDir, {recursive: true});
    fs.writeFileSync(publicDir + "/index.html", indexHTMLContentUpdated);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "WebApp Built");
}

export default async function(config) {
    loadEnvVars();
    cleanOutDir(config.out);
    await Promise.all([
        buildServer(config),
        buildWebApp(config)
    ]);
}
