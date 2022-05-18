import path from "path"
import esbuild, {buildSync, Format, Loader, Platform} from "esbuild";
import fs from "fs";
import {exec, execSync} from "child_process";
import {copyRecursiveSync, defaultEsbuildConfig, execScript, getPackageJSON} from "./utils";
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

async function buildServer(config, watcher){
    const packageConfigs = getPackageJSON();

    const options = {
        entryPoints: [ config.src + "/server.ts" ],
        outfile: config.out + "/index.js",
        platform: "node" as Platform,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
        plugins: [],

        define: {
            ...getProcessEnv(),
            'process.env.VERSION': JSON.stringify(packageConfigs.version),
            'process.env.DEPENDENCIES': JSON.stringify(packageConfigs.dependencies)
        },

        watch: watcher ? {
            onRebuild: async function(error, result){
                if (error) console.error('Server build failed:', error)
                watcher();
            }
        } : false
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    if(watcher) {
        const watcherScript = execSync(`npx esbuild ${path.resolve(__dirname, "../server/watcher.ts")} --minify --format=cjs`);
        fs.writeFileSync(config.out + "/watcher.js", watcherScript);
    }

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Server Built");
}

async function buildWebApp(config, watcher){
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

        assetNames: "assets/[name]-[hash]",
        loader: {
            ".png": "file" as Loader,
            ".jpg": "file" as Loader,
            ".svg": "file" as Loader
        },

        watch: watcher ? {
            onRebuild: async function(error, result){
                if (error) console.error('WebApp build failed:', error)
                watcher(true);
            }
        } : false
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    const packageConfigs = getPackageJSON();

    const indexHTML = path.resolve(__dirname, "../webapp/index.html");
    const indexHTMLContent = fs.readFileSync( indexHTML, {encoding: "utf-8"});
    let indexHTMLContentUpdated = indexHTMLContent.replace("{TITLE}",
        packageConfigs.title ?? packageConfigs.name ?? "New Webapp");

    const versionString = (packageConfigs.version ?? "") + "-" +
        crypto.randomBytes(4).toString('hex').toUpperCase();
    indexHTMLContentUpdated = indexHTMLContentUpdated.replace("{VERSION}", versionString);

    if(watcher){
        const watcherScript = execSync(`npx esbuild ${path.resolve(__dirname, "../webapp/watcher.ts")} --minify`).toString();
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

    const coverageHTMLDir = path.resolve(process.cwd(), "coverage");
    if(fs.existsSync(coverageHTMLDir))
        copyRecursiveSync(coverageHTMLDir, publicDir + "/coverage");

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "WebApp Built");
}

export default async function(config, watcher: (isWebApp: boolean) => void = null) {
    loadEnvVars();
    cleanOutDir(config.out);

    await execScript(path.resolve(process.cwd(), "prebuild.ts"));

    await Promise.all([
        buildServer(config, watcher),
        buildWebApp(config, watcher)
    ]);

    await execScript(path.resolve(process.cwd(), "postbuild.ts"));
}
