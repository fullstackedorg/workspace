export const moduleExtensions = [
    ".js",
    ".jsx",
    ".mjs",
    ".ts",
    ".tsx"
]

export const possibleJSExtensions = [
    ...moduleExtensions,
    "",
    "x",
    "/index.js",
    "/index.jsx",
    "/index.mjs",
    "/index.ts",
    "/index.tsx"
]

export function getModulePathWithT(modulePath, tree) {
    const isAsset = !moduleExtensions.find(ext => modulePath.endsWith(ext));

    let moduleSafePath;
    if(isAsset){
        moduleSafePath = tree[modulePath].assetName;
    }else{
        const splitAtDot = modulePath.split(".");
        splitAtDot.pop();
        moduleSafePath = splitAtDot.join(".") + ".js";
    }

    if (!tree) tree = {};

    if (!tree[modulePath])
        tree[modulePath] = {}

    if (!tree[modulePath].t)
        tree[modulePath].t = 0;

    return {path: moduleSafePath +"?t=" + tree[modulePath].t, isAsset};
}

function invalidateModulesRecursively(modulePath, t, tree) {
    tree[modulePath].t = t;
    if(tree[modulePath].parents)
        tree[modulePath].parents.forEach(parent => invalidateModulesRecursively(parent, t, tree));
    return tree;
}

export function invalidateModule(modulePath, tree) {
    const t = Date.now();
    return invalidateModulesRecursively(modulePath, t, tree);
}
