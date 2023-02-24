import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {maybePullImages} from "./testsDockerImages";

const __dirname = dirname(fileURLToPath(import.meta.url));

execSync(`npm pack --pack-destination ${resolve(__dirname, "..", "create-fullstacked")}`, {stdio: "inherit"});

await maybePullImages([
    "postgres",
    "wordpress",
    "mysql:5.7",
    "typesense/typesense:0.23.1"
]);