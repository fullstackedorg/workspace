import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import version from "../version.js";

execSync("npm pack", {stdio: "inherit"});

const __dirname = dirname(fileURLToPath(import.meta.url));

execSync(`npm i ${resolve(__dirname, "..", `fullstacked-${version}.tgz`)} --no-save && npm test`, {
    stdio: "inherit",
    cwd: resolve(__dirname, "..", "create-fullstacked")
});
