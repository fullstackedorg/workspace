import {cpSync} from "fs";

const directoriesToCopy = [
    ["pwa", "dist/main/client/pwa"],
    ["pwa", "dist/lite/client/pwa"],
    ["src/main/server/terminal/bin", "dist/main/server/bin"],
    ["src/main/server/terminal/bat", "dist/main/server/bat"]
]

directoriesToCopy.forEach(([from, to]) => {
    cpSync(from, to, {recursive: true});
});