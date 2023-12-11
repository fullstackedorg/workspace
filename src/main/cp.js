import {cpSync} from "fs";
import {dirname, resolve} from "path";
import { fileURLToPath } from "url";

const directoriesToCopy = [
    ["../../pwa", "../../dist/client/pwa"],
    ["server/terminal/bin", "../../dist/server/bin"],
    ["server/terminal/bat", "../../dist/server/bat"]
]

const currentDir = fileURLToPath(dirname(import.meta.url));

directoriesToCopy.forEach(([from, to]) => {
    cpSync(resolve(currentDir, from), resolve(currentDir, to), {recursive: true});
});