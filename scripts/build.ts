import path from "path"
import esbuild, {Format, Loader, Platform} from "esbuild";
import fs from "fs";
import {execSync} from "child_process";
import {cleanOutDir, copyRecursiveSync, execScript, getPackageJSON} from "./utils";
import crypto from "crypto";

// load .env located at root of src
function loadEnvVars(srcDir: string){
    const pathENV = path.resolve(srcDir, ".env");

    if(!fs.existsSync(pathENV))
        return

    require('dotenv').config({
        path: pathENV
    });
}

// get all env variables in the form of an object
function getProcessedEnv(){
    let processEnv = {};
    Object.keys(process.env).forEach(envKey => {
        // keys with parenthesis causes problems
        if(envKey.includes("(") || envKey.includes(")"))
            return;

        processEnv['process.env.' + envKey] = "'" + escape(process.env[envKey].trim()) + "'";
    });

    return processEnv;
}

// bundles the server
async function buildServer(config, watcher){
    const packageConfigs = getPackageJSON();

    const options = {
        entryPoints: [ config.src + "/server.ts" ],
        outfile: config.out + "/index.js",
        platform: "node" as Platform,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',

        define: {
            ...getProcessedEnv(),
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

    // attach watcher script in defined
    if(watcher) {
        const watcherScript = execSync(`npx esbuild ${path.resolve(__dirname, "../server/watcher.ts")} --minify --format=cjs`);
        fs.writeFileSync(config.out + "/watcher.js", watcherScript);
    }

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Server Built");
}

// bundles the web app
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

        define: getProcessedEnv(),

        // assets like images are stored at dist/public/assets
        // and the server reroutes all asset request to this directory
        // this is too avoid using publicPath and implies other issues
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

    // set the index.html file
    const indexHTML = path.resolve(__dirname, "../webapp/index.html");
    const indexHTMLContent = fs.readFileSync( indexHTML, {encoding: "utf-8"});
    // add page title
    let indexHTMLContentUpdated = indexHTMLContent.replace("{TITLE}",
        packageConfigs.title ?? packageConfigs.name ?? "New Webapp");

    // add js entrypoint with version and and random string as query param v
    // helps a lot for cache busting
    const versionString = (packageConfigs.version ?? "") + "-" +
        crypto.randomBytes(4).toString('hex').toUpperCase();
    indexHTMLContentUpdated = indexHTMLContentUpdated.replace("{VERSION}", versionString);

    // attach watcher if defined
    if(watcher){
        const watcherScript = execSync(`npx esbuild ${path.resolve(__dirname, "../webapp/watcher.ts")} --minify`).toString();
        const closingBodyIndex = indexHTMLContentUpdated.indexOf("</body>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingBodyIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingBodyIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<script>${watcherScript}</script>` + postHTML;
    }

    // add favicon if present
    const faviconFile = path.resolve(config.src, "favicon.png");
    if(fs.existsSync(faviconFile)){
        // copy file to dist/public
        fs.copyFileSync(faviconFile, publicDir + "/favicon.png");

        // add link tag in head
        const closingHeadIndex = indexHTMLContentUpdated.indexOf("</head>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingHeadIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingHeadIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<link rel="icon" href="/favicon.png">` + postHTML;
    }

    // output index.html
    fs.mkdirSync(publicDir, {recursive: true});
    fs.writeFileSync(publicDir + "/index.html", indexHTMLContentUpdated);

    // copy coverage folder if present
    const coverageHTMLDir = path.resolve(process.cwd(), "coverage");
    if(fs.existsSync(coverageHTMLDir))
        copyRecursiveSync(coverageHTMLDir, publicDir + "/coverage");

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "WebApp Built");
}

export default async function(config, watcher: (isWebApp: boolean) => void = null) {
    loadEnvVars(config.src);
    cleanOutDir(config.out);

    // prebuild script
    await execScript(path.resolve(config.src, "prebuild.ts"), config);

    // build server and webapp
    await Promise.all([
        buildServer(config, watcher),
        buildWebApp(config, watcher)
    ]);

    // prebuild script
    await execScript(path.resolve(config.src, "postbuild.ts"), config);
}
