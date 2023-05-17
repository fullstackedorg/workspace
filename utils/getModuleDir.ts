import {join} from "path";
import fs from "fs";
import {pathToFileURL} from "url";

// source: https://stackoverflow.com/a/72942136/9777391
export default async function (module: string) {
    const packageName = module.includes('/')
        ? module.startsWith('@')
            ? module.split('/').slice(0, 2).join('/')
            : module.split('/')[0]
        : module;

    // polyfill
    if(!global.require){
        global.require = (await import("module")).Module.createRequire(import.meta.url);
    }

    const lookupPaths = require.resolve.paths(module).map((p) => join(p, packageName));
    const foundPath = lookupPaths.find(p => fs.existsSync(p));
    return foundPath ? pathToFileURL(foundPath) : null;
}
