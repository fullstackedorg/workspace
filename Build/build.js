const path = require("path");
const esbuild = require("esbuild");
const fs = require("fs");

const outDir = path.resolve(process.cwd(),  "dist");

function cleanOutDir(){
    fs.rmSync(outDir, {force: true, recursive: true});
}

async function buildBackend(entrypoint){
    const options = {
        entryPoints: [ entrypoint ],
        outfile: outDir + "/index.js",
        platform: "node",
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production',
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    console.log('\x1b[32m%s\x1b[0m', "Backend Built");
}

async function buildFrontend(entrypoint){
    const publicDir = outDir + "/public";

    const options = {
        entryPoints: [ entrypoint ],
        outdir: publicDir,
        format: "esm",
        splitting: true,
        bundle: true,
        minify: process.env.NODE_ENV === 'production',
        sourcemap: process.env.NODE_ENV !== 'production'
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    const indexHTML = path.resolve(__dirname, "../WebApp/index.html");
    const indexHTMLContent = fs.readFileSync( indexHTML, {encoding: "utf-8"});
    const indexHTMLContentUpdated = indexHTMLContent.replace("{TITLE}", "FullStacked");
    fs.mkdirSync(publicDir, {recursive: true});
    fs.writeFileSync(publicDir + "/index.html", indexHTMLContentUpdated);

    console.log('\x1b[32m%s\x1b[0m', "Frontend Built");
}

async function build({src}){
    cleanOutDir();
    await Promise.all([
        buildBackend(src + "/server.ts"),
        buildFrontend(src + "/index.tsx")
    ]);
}

module.exports = build;
