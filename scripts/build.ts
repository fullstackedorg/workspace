import path from "path"
import esbuild, {buildSync, Format, Loader, Platform} from "esbuild";
import fs from "fs";
import {cleanOutDir, copyRecursiveSync, execScript, randStr} from "./utils";
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
        if(envKey.includes("(") || envKey.includes(")") || envKey.includes("-"))
            return;

        processEnv['process.env.' + envKey] = "'" + escape(process.env[envKey].trim()) + "'";
    });

    processEnv['process.env.VERSION'] = JSON.stringify(config.version)

    return processEnv;
}

// bundles the server
async function buildServer(config: Config, watcher){
    const options = {
        entryPoints: [ path.resolve(config.src, "server", "index.ts") ],
        outfile: path.resolve(config.out, "index.js"),
        platform: "node" as Platform,
        bundle: true,
        minify: config.production,
        sourcemap: !config.production,

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

    // get docker-compose.yml template file
    let dockerComposeRaw = fs.readFileSync(path.resolve(__dirname, "../docker-compose.yml"), {encoding: "utf-8"});
    let dockerCompose = yaml.parse(dockerComposeRaw);

    if(watcher){
        dockerCompose.services["node"].command += " --development";
        buildSync({
            entryPoints: [ path.resolve(__dirname, "..", "server", "watcher.ts") ],
            outfile: path.resolve(config.out, "watcher.js"),
            platform: "node" as Platform,
            bundle: true,
            minify: true,
            sourcemap: false,
        })
    }

    // merge with user defined docker-compose if existent
    const userDockerComposeFilePath = path.resolve(config.src, "docker-compose.yml");
    if(fs.existsSync(userDockerComposeFilePath)){
        const userDockerCompose = yaml.parse(fs.readFileSync(userDockerComposeFilePath, {encoding: "utf-8"}));
        if(userDockerCompose) {
            dockerCompose = {
                ...dockerCompose,
                ...userDockerCompose,
                services: {
                    ...dockerCompose.services,
                    ...(userDockerCompose.services ?? {})
                }
            };
        }
    }

    // replace version directory
    const dockerComposeStr = yaml.stringify(dockerCompose).replace(/\$\{VERSION\}/g, config.version);

    // output docker-compose result to dist directory
    fs.writeFileSync(path.resolve(config.dist, "docker-compose.yml"), dockerComposeStr);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "Server Built");
}

// bundles the web app
async function buildWebApp(config, watcher){
    const entrypoint = path.resolve(config.src, "webapp", "index.ts");

    if(!fs.existsSync(entrypoint)){
        fs.mkdirSync(config.public, {recursive: true});
        return fs.writeFileSync(path.resolve(config.public, "index.html"), "Nothing to see here...");
    }

    const options = {
        entryPoints: [ entrypoint ],
        outdir: config.public,
        entryNames: "index",
        format: "esm" as Format,
        splitting: true,
        bundle: true,
        minify: config.production,
        sourcemap: !config.production,

        define: getProcessedEnv(config),

        // assets like images are stored at dist/{VERSION}/public/assets
        // and the server reroutes all asset request to this directory
        // this is to avoid using publicPath and implies other issues
        assetNames: "assets/[name]-[hash]",
        loader: {
            ".png": "file" as Loader,
            ".jpg": "file" as Loader,
            ".svg": "file" as Loader,
            ".md": "file" as Loader,
            ".ttf": "file" as Loader,
        },

        watch: watcher ? {
            onRebuild: async function(error, result){
                if (error) return

                webAppPostBuild(config, watcher);

                watcher(true);
            }
        } : false,

        plugins: watcher ? [{
            name: 'watch-extra-files',
            setup(build) {

                const extraFiles = config.watchFile
                    ? Array.isArray(config.watchFile)
                        ? config.watchFile.map(file => path.resolve(config.src, file))
                        : [path.resolve(config.src, config.watchFile)]
                    : [];

                const extraDirs = config.watchDir
                    ? Array.isArray(config.watchDir)
                        ? config.watchDir.map(dir => path.resolve(config.src, dir))
                        : [path.resolve(config.src, config.watchDir)]
                    : [];

                build.onResolve({ filter: /.*/ }, args => {
                    return {
                        watchFiles: extraFiles.concat([
                            path.resolve(config.src, "webapp", "index.html"),
                            path.resolve(config.src, "webapp", "index.css")
                        ]),
                        watchDirs: extraDirs
                    };
                })
            },
        }] : []
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    webAppPostBuild(config, watcher);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "WebApp Built");
}


export function webAppPostBuild(config: Config, watcher){
    let indexHTML = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const userDefinedIndexHTMLFilePath = path.resolve(config.src, "webapp", "index.html");
    if(fs.existsSync(userDefinedIndexHTMLFilePath)){
        indexHTML = fs.readFileSync(userDefinedIndexHTMLFilePath, {encoding: "utf-8"});
    }

    const addInHEAD = (contentHTML: string) => {
        const closingHeadIndex = indexHTML.indexOf("</head>");

        if(closingHeadIndex === -1){
            indexHTML += contentHTML;
            return;
        }

        const preHTML = indexHTML.slice(0, closingHeadIndex);
        const postHTML = indexHTML.slice(closingHeadIndex, indexHTML.length);
        indexHTML = preHTML + contentHTML + postHTML;
    }

    const addInBODY = (contentHTML: string) => {
        const closingBodyIndex = indexHTML.indexOf("</body>");

        if(closingBodyIndex === -1){
            indexHTML += contentHTML;
            return;
        }

        const preHTML = indexHTML.slice(0, closingBodyIndex);
        const postHTML = indexHTML.slice(closingBodyIndex, indexHTML.length);
        indexHTML = preHTML + contentHTML + postHTML;
    }

    // add title
    if(!indexHTML.includes("<title>")){
        addInHEAD(`<title>${config.title ?? config.name ?? "FullStacked WebApp"}</title>`)
    }

    // add js entrypoint
    addInBODY(`<script type="module" src="/index.js?v=${config.version + "-" + config.hash + "-" + randStr(6)}"></script>`)


    // attach watcher if defined
    if(watcher){
        buildSync({
            entryPoints: [path.resolve(__dirname, "../webapp/watcher.ts")],
            minify: true,
            outfile: path.resolve(config.public, "watcher.js"),
            bundle: true
        });

        addInBODY(`<script src="/watcher.js"></script>`);
    }

    // add favicon if present
    const faviconFile = path.resolve(config.src, "webapp", "favicon.png");
    if(fs.existsSync(faviconFile)){
        // copy file to dist/public
        fs.copyFileSync(faviconFile, path.resolve(config.public, "favicon.png"));

        // add link tag in head
        addInHEAD(`<link rel="icon" href="/favicon.png">`);
    }

    // add app-icons dir if present
    const appIconsDir = path.resolve(config.src, "webapp", "app-icons");
    if(fs.existsSync(appIconsDir)){
        // copy file to dist/public
        copyRecursiveSync(appIconsDir, path.resolve(config.public, "app-icons"));
    }

    // index.css root file
    const CSSFile = path.resolve(config.src, "webapp", "index.css");
    if(fs.existsSync(CSSFile)){
        // copy file to dist/public
        fs.copyFileSync(CSSFile, path.resolve(config.public, "index.css"));

        // add link tag
        addInHEAD(`<link rel="stylesheet" href="/index.css?v=${config.version + "-" + config.hash}">`)
    }

    // web app manifest
    const manifestFilePath = path.resolve(config.src, "webapp", "manifest.json");
    if(fs.existsSync(manifestFilePath)){
        // copy the file
        fs.cpSync(manifestFilePath, path.resolve(config.public, "manifest.json"));

        // add reference tag in head
        addInHEAD(`<link rel="manifest" href="/manifest.json" />`);
    }

    // build service-worker and reference in index.html
    const serviceWorkerFilePath = path.resolve(config.src, "webapp", "service-worker.ts");
    if(fs.existsSync(serviceWorkerFilePath)){
        buildSync({
            entryPoints: [path.resolve(__dirname, "../webapp/ServiceWorkerRegistration.ts")],
            define: {
                "process.env.VERSION": JSON.stringify(config.version)
            },
            minify: true,
            outfile: path.resolve(config.public, "service-worker.js")
        });

        // add reference tag in head
        addInHEAD(`<script src="/service-worker.js"></script>`);

        // build service worker scripts
        buildSync({
            entryPoints: [serviceWorkerFilePath],
            outfile: path.resolve(config.public, "service-worker-entrypoint.js"),
            bundle: true,
            minify: true,
            sourcemap: true
        });
    }

    // output index.html
    fs.mkdirSync(config.public, {recursive: true});
    fs.writeFileSync(path.resolve(config.public, "index.html"), indexHTML);
}

export default async function(config, watcher: (isWebApp: boolean) => void = null) {
    loadEnvVars(config.src);
    cleanOutDir(config.dist);

    // prebuild script
    await execScript(path.resolve(config.src, "prebuild.ts"), config);

    // build server and webapp
    await Promise.all([
        buildServer(config, watcher),
        buildWebApp(config, watcher)
    ]);

    // postbuild script
    await execScript(path.resolve(config.src, "postbuild.ts"), config);
}
