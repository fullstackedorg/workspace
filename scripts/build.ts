import path from "path"
import esbuild, {buildSync, Format, Loader, Platform} from "esbuild";
import fs from "fs";
import {cleanOutDir, copyRecursiveSync, defaultEsbuildConfig, execScript} from "./utils";
import crypto from "crypto";
import yaml from "yaml";


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
function getProcessedEnv(config: Config){
    let processEnv = {};
    Object.keys(process.env).forEach(envKey => {
        // keys with parenthesis causes problems
        if(envKey.includes("(") || envKey.includes(")"))
            return;

        processEnv['process.env.' + envKey] = "'" + escape(process.env[envKey].trim()) + "'";
    });

    processEnv['process.env.VERSION'] = JSON.stringify(config.version)

    return processEnv;
}

// bundles the server
async function buildServer(config, watcher){
    const options = {
        entryPoints: [ path.resolve(config.src, "server.ts") ],
        outfile: path.resolve(config.out, config.version, "index.js"),
        platform: "node" as Platform,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',

        define: getProcessedEnv(config),

        watch: watcher ? {
            onRebuild: async function(error, result){
                if(error) return;
                watcher();
            }
        } : false
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    // attach watcher script if defined
    if(watcher) {
        buildSync({
            entryPoints: [path.resolve(__dirname, "../server/watcher.ts")],
            outfile: path.resolve(config.out, config.version, "watcher.js"),
            minify: true,
            format: "cjs"
        });
    }

    // get docker-compose.yml template file
    let dockerCompose = fs.readFileSync(path.resolve(__dirname, "../docker-compose.yml"), {encoding: "utf-8"});

    // merge with user defined docker-compose if existant
    const srcDockerComposeFilePath = path.resolve(config.src, "docker-compose.yml");
    if(fs.existsSync(srcDockerComposeFilePath)){
        const templateDockerCompose = yaml.parse(dockerCompose);
        const srcDockerCompose = yaml.parse(fs.readFileSync(srcDockerComposeFilePath, {encoding: "utf-8"}));
        if(srcDockerCompose)
            dockerCompose = yaml.stringify({
                ...templateDockerCompose,
                ...srcDockerCompose,
                services: {
                    ...templateDockerCompose.services,
                    ...(srcDockerCompose.services ?? {})
                }
            });
    }

    // replace version directory
    dockerCompose = dockerCompose.replace(/\$\{VERSION\}/g, config.version);

    // output docker-compose result to dist directory
    fs.writeFileSync(path.resolve(config.out, "docker-compose.yml"), dockerCompose);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Server Built");
}

// bundles the web app
async function buildWebApp(config, watcher){
    const publicDir = path.resolve(config.out, config.version, "public");

    const options = {
        entryPoints: [ path.resolve(config.src, "index.tsx") ],
        outdir: publicDir,
        format: "esm" as Format,
        splitting: true,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',

        define: getProcessedEnv(config),

        // assets like images are stored at dist/{VERSION}/public/assets
        // and the server reroutes all asset request to this directory
        // this is too avoid using publicPath and implies other issues
        assetNames: "assets/[name]-[hash]",
        loader: {
            ".png": "file" as Loader,
            ".jpg": "file" as Loader,
            ".svg": "file" as Loader,
            ".md": "file" as Loader
        },

        watch: watcher ? {
            onRebuild: async function(error, result){
                if (error) return

                webAppPostBuild(config, watcher);

                watcher(true);
            }
        } : false
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    webAppPostBuild(config, watcher);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "WebApp Built");
}

export function webAppPostBuild(config: Config, watcher){
    const publicDir = path.resolve(config.out, config.version, "public");

    // get the index.html file
    const indexHTML = path.resolve(__dirname, "../webapp/index.html");
    const indexHTMLContent = fs.readFileSync( indexHTML, {encoding: "utf-8"});
    // add page title
    let indexHTMLContentUpdated = indexHTMLContent.replace("{TITLE}",
        config.title ?? config.name ?? "New Webapp");

    // add js entrypoint with version and and random string as query param v
    // helps a lot for cache busting
    const versionString = (config.version ?? "") + "-" +
        crypto.randomBytes(4).toString('hex').toUpperCase();
    indexHTMLContentUpdated = indexHTMLContentUpdated.replace("{VERSION}", versionString);

    // attach watcher if defined
    if(watcher){
        buildSync({
            entryPoints: [path.resolve(__dirname, "../webapp/watcher.ts")],
            minify: true,
            outfile: path.resolve(publicDir, "watcher.js")
        });

        const closingBodyIndex = indexHTMLContentUpdated.indexOf("</head>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingBodyIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingBodyIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<script src="/watcher.js"></script>` + postHTML;
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

    // index.css root file
    const CSSFile = path.resolve(config.src, "index.css");
    if(fs.existsSync(CSSFile)){
        // copy file to dist/public
        fs.copyFileSync(CSSFile, publicDir + "/index.css");

        // add link tag in head
        const closingBodyIndex = indexHTMLContentUpdated.indexOf("</body>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingBodyIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingBodyIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<link rel="stylesheet" href="/index.css?v=${versionString}">` + postHTML;
    }

    // web app manifest
    const manifestFilePath = path.resolve(config.src, "manifest.json");
    if(fs.existsSync(manifestFilePath)){
        // copy the file
        fs.cpSync(manifestFilePath, path.resolve(publicDir, "manifest.json"));

        // add reference tag in head
        const closingHeadIndex = indexHTMLContentUpdated.indexOf("</head>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingHeadIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingHeadIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<link rel="manifest" href="/manifest.json" />` + postHTML;
    }

    // build service-worker and reference in index.html
    const serviceWorkerFilePath = path.resolve(config.src, "service-worker.ts");
    if(fs.existsSync(serviceWorkerFilePath)){
        buildSync({
            entryPoints: [path.resolve(__dirname, "../webapp/ServiceWorkerRegistration.ts")],
            define: {
                "process.env.VERSION": JSON.stringify(config.version)
            },
            minify: true,
            outfile: path.resolve(publicDir, "service-worker.js")
        });

        // add reference tag in head
        const closingHeadIndex = indexHTMLContentUpdated.indexOf("</head>");
        const preHTML = indexHTMLContentUpdated.slice(0, closingHeadIndex);
        const postHTML = indexHTMLContentUpdated.slice(closingHeadIndex, indexHTMLContentUpdated.length);
        indexHTMLContentUpdated = preHTML + `<script src="/service-worker.js"></script>` + postHTML;

        buildSync({
            entryPoints: [serviceWorkerFilePath],
            outfile: path.resolve(publicDir, "service-worker", "index.js"),
            bundle: true,
            minify: true,
            sourcemap: true
        });
    }

    // output index.html
    fs.mkdirSync(publicDir, {recursive: true});
    fs.writeFileSync(publicDir + "/index.html", indexHTMLContentUpdated);
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
