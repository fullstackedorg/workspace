import path from "path"
import esbuild, {Format, Loader, Platform} from "esbuild";
import fs from "fs";

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

    const indexHTML = path.resolve(__dirname, "../webapp/index.html");
    const indexHTMLContent = fs.readFileSync( indexHTML, {encoding: "utf-8"});
    const indexHTMLContentUpdated = indexHTMLContent.replace("{TITLE}", "FullStacked");
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
