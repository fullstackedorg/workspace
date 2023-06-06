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

                    const filePathsToTest = [
                        args.path,
                        args.path + ".ts",
                        args.path + ".tsx",
                        args.path + "/index.ts",
                        args.path + "/index.tsx"
                    ];

                    const relativeFilePathToBuild = filePathsToTest.find((fileEnd, index) => {
                        const maybeFile = resolve(dirname(currentBuild.initialOptions.entryPoints[0]), fileEnd);
                        return fs.existsSync(maybeFile) && fs.statSync(maybeFile).isFile();
                    });

                    if(!relativeFilePathToBuild){
                        return {external: true};
                    }

                    const absoluteFilePathToBuild = resolve(dirname(currentBuild.initialOptions.entryPoints[0]), relativeFilePathToBuild);

                    if(!filesToBuild.has(absoluteFilePathToBuild)) {
                        filesToBuild.add(absoluteFilePathToBuild);

                        const jsPath = convertPathToJSExt(absoluteFilePathToBuild);
                        if(fs.existsSync(jsPath)) fs.rmSync(jsPath)
                        if(fs.existsSync(jsPath + ".map")) fs.rmSync(jsPath + ".map");

                        await recurse(absoluteFilePathToBuild, filesToBuild);
                    }

                    return {
                        external: true,
                        path: convertPathToJSExt(relativeFilePathToBuild)
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
        filesToBuild.add(entry);
        await recurse(entry, filesToBuild);
        resolve();
    })));

    if(!silent)
        console.log(`Built ${filesToBuild.size} files in ${(Date.now() - start)}ms`);
}
