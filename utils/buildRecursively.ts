import {build} from "esbuild";
import {dirname, resolve} from "path";
import fs from "fs";

export function convertPathToJSExt(filePath){
    if(filePath.endsWith(".js"))
        return filePath;
    else if(filePath.endsWith(".ts"))
        return filePath.slice(0, -2) + "js";
    else if(filePath.endsWith(".tsx"))
        return filePath.slice(0, -3) + "js";
    else
        return filePath + ".js";
}

async function recurse(filePath: string, filesToBuild: Set<string>){
    await build({
        entryPoints: [filePath],
        outfile: convertPathToJSExt(filePath),
        platform: "node",
        format: "esm",
        sourcemap: true,
        bundle: true,
        plugins: [{
            name: "recursive-builder",
            setup(currentBuild){
                currentBuild.onResolve({filter: /.*/}, async (args) => {
                    if(args.kind === "entry-point") return null;
                    if(!args.path.startsWith(".")) return {external: true};

                    const filePathToBuild = [
                        args.path,
                        args.path + ".ts",
                        args.path + ".tsx"
                    ].map(filePath => resolve(dirname(currentBuild.initialOptions.entryPoints[0]), filePath))
                        .find(maybeFile => fs.existsSync(maybeFile) && fs.statSync(maybeFile).isFile());

                    if(!filePathToBuild){
                        throw Error(`Cannot find file at [${resolve(dirname(currentBuild.initialOptions.entryPoints[0]), args.path)}]`);
                    }

                    const path = convertPathToJSExt(args.path);

                    if(filesToBuild.has(filePathToBuild)) {
                        return { external: true, path };
                    }

                    filesToBuild.add(filePathToBuild);

                    if(fs.existsSync(path)) fs.rmSync(path);
                    if(fs.existsSync(path + ".map")) fs.rmSync(path + ".map");

                    await recurse(filePathToBuild, filesToBuild);

                    return {
                        external: true,
                        path
                    };
                })
            }
        }]
    });
}

export default async function buildRecursively(entrypoints: string[], silent = false) {
    const filesToBuild = new Set<string>();
    const start = Date.now();

    await Promise.all(entrypoints.map(entry => new Promise<void>(async resolve => {
        filesToBuild.add(entry)
        await recurse(entry, filesToBuild);
        resolve();
    })));

    if(!silent)
        console.log(`Built ${filesToBuild.size} files in ${(Date.now() - start)}ms`);
}
