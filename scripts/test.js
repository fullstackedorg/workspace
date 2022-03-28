const esbuild = require("esbuild");
const glob = require("glob");
const path = require("path");

const tests = glob.sync(path.resolve(__dirname, "../tests/**/test.ts"));

async function buildTest(entrypoint){
    const options = {
        entryPoints: [ entrypoint ],
        outfile: entrypoint.replace(/.ts$/, ".js"),
        platform: "node",
        bundle: true,
        minify: false,
        sourcemap: true,
        external: ["mocha", "puppeteer", "v8-to-istanbul"]
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    console.log('\x1b[32m%s\x1b[0m', "Built Test :", entrypoint);
}

tests.forEach(buildTest);
