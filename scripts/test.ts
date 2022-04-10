import esbuild, {Platform, PluginBuild} from "esbuild"
import glob from "glob";
import path from "path";
import fs from "fs";

const tests = glob.sync(path.resolve(__dirname, "../**/test.ts")).filter(file => !file.includes("scripts"));
const tmpDir = process.cwd() + "/.tests";

fs.rmSync(tmpDir, {recursive: true, force: true});

const fullstackedRoot = path.resolve(__dirname, "..");
const tsConfig = JSON.parse(fs.readFileSync(fullstackedRoot + "/tsconfig.json", {encoding: "utf8"}));

const builtFiles: string[] = [];

async function buildTest(entrypoint){
    const relativePath = entrypoint.slice(process.cwd().length);
    const pathComponents = relativePath.split("/")
    const fileName = pathComponents.pop();
    const relativeDir = pathComponents.join("/");

    const outdir = tmpDir + relativeDir;

    let outfile = outdir + "/" + fileName.replace(/.ts$/, ".js");
    if(!outfile.endsWith(".js"))
        outfile += ".js";

    const options = {
        entryPoints: [ entrypoint ],
        outfile: outfile,
        platform: "node" as Platform,
        plugins: [{
            // build import to the .tests output
            name: "crawler",
            setup(build: PluginBuild) {
                build.onResolve({filter:/.*/}, async (args) => {
                    if(args.kind === "entry-point")
                        return null;

                    let isNodeModule = false;

                    if(args.resolveDir.includes("node_modules"))
                        isNodeModule = true;

                    if(!isNodeModule && !args.path.includes("/") && !fs.existsSync(path.resolve(fullstackedRoot, args.path + ".ts")))
                        isNodeModule = true;

                    if(Object.keys(tsConfig.compilerOptions.paths).includes(args.path))
                        isNodeModule = false;


                    if(isNodeModule)
                        return { path: args.path, external: true };

                    let importAbsolutePath, importRelativePath;
                    if(Object.keys(tsConfig.compilerOptions.paths).includes(args.path)){
                        importRelativePath = tsConfig.compilerOptions.paths[args.path][0];
                        importAbsolutePath = path.resolve(fullstackedRoot, tsConfig.compilerOptions.baseUrl, importRelativePath);
                    }else{
                        importAbsolutePath = path.resolve(fullstackedRoot, tsConfig.compilerOptions.baseUrl, args.path);
                        importRelativePath = args.path;
                    }


                    importRelativePath = importRelativePath.replace(/.ts$/, ".js");
                    if(!importRelativePath.endsWith(".js"))
                        importRelativePath += ".js";

                    const updatedImportPath = { path: path.resolve(tmpDir, importRelativePath), external: true };

                    if(builtFiles.includes(importAbsolutePath))
                        return updatedImportPath;

                    builtFiles.push(importAbsolutePath);
                    await buildTest(path.resolve(importAbsolutePath));

                    return updatedImportPath;
                });
            }
        }],
        bundle: true,
        minify: false,
        sourcemap: true,

        define: {
            "process.env.ROOT": "\"" + fullstackedRoot + "\""
        }
    }

    const result = await esbuild.build(options);

    if(result.errors.length > 0)
        return;

    console.log('\x1b[32m%s\x1b[0m', "Built File for Tests :", entrypoint);
}

tests.forEach(buildTest);
