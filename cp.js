import {cpSync} from "fs";
import {dirname} from "path";


const directoriesToCopy = [
    ["/pwa", "/dist/client/pwa"],
    ["/server/bin", "/dist/server/bin"],
    ["/server/bat", "/dist/server/bat"]
]

const currentDir = new URL(dirname(import.meta.url));

directoriesToCopy.forEach(([from, to]) => {
    const fromURL = new URL(currentDir);
    fromURL.pathname += from;
    const toURL = new URL(currentDir);
    toURL.pathname += to;
    cpSync(fromURL, toURL, {recursive: true});
});