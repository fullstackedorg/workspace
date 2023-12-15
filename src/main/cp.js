import {cpSync} from "fs";

const directoriesToCopy = [
    ["pwa", "dist/client/pwa"],
    ["pwa", "electron/dist/client/pwa"],
    ["src/main/server/terminal/bin", "dist/server/bin"],
    ["src/main/server/terminal/bat", "dist/server/bat"]
]

directoriesToCopy.forEach(([from, to]) => {
    cpSync(from, to, {recursive: true});
});