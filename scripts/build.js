const path = require("path");
const esbuild = require("esbuild");
const fs = require("fs");

function cleanOutDir(dir){
    fs.rmSync(dir, {force: true, recursive: true});
}

async function buildServer(config){
    const options = {
        entryPoints: [ config.src + "/server.ts" ],
        outfile: config.out + "/index.js",
        platform: "node",
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
        plugins: [],

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
        format: "esm",
        splitting: true,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',

        publicPath: "/",
        loader: {
            ".png": "file"
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

    const indexHTML = path.resolve(__dirname, "../webapp/index.html");
    const indexHTMLContent = fs.readFileSync( indexHTML, {encoding: "utf-8"});
    const indexHTMLContentUpdated = indexHTMLContent.replace("{TITLE}", "FullStacked");
    fs.mkdirSync(publicDir, {recursive: true});
    fs.writeFileSync(publicDir + "/index.html", indexHTMLContentUpdated);

    if(!config.silent)
        console.log('\x1b[32m%s\x1b[0m', "WebApp Built");
}

async function build(config) {
    cleanOutDir(config.out);
    await Promise.all([
        buildServer(config),
        buildWebApp(config)
    ]);
}

module.exports = build;
