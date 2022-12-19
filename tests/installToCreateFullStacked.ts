import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

execSync(`npm pack --pack-destination ${resolve(__dirname, "..", "create-fullstacked")}`, {stdio: "inherit"});
