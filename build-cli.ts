import esbuild from "esbuild";
import glob from "glob";
import path from "path";

(async function() {
    const cli = path.resolve(__dirname, "./cli.ts");
    const scripts = glob.sync(path.resolve(__dirname, "./scripts") + "/**/*.ts")
        .concat([path.resolve(__dirname, "./postinstall.ts")])
        .concat([path.resolve(__dirname, "./.mocharc.ts")])
        .filter(file => !file.endsWith(".d.ts"));

    const buildPromises = [cli].concat(scripts).map(file => {
        return esbuild.build({
            entryPoints: [file],
            outfile: file.slice(0, -2) + "js",
            format: "cjs",
            sourcemap: true
        });
    });

    await Promise.all(buildPromises);
    console.log('\x1b[32m%s\x1b[0m', "cli and scripts built");
})()
