import {fork} from "child_process";
import {fileURLToPath} from "url";
import {dirname} from "path"

const currentDir = dirname(fileURLToPath(import.meta.url));

fork(`${currentDir}/dist/server/index.mjs`, {
    env: {
        ...process.env,
        NODE_ENV: "production",
        CLIENT_DIR: `${currentDir}/dist/client`
    }
});

console.log("FullStacked running at http://localhost:8000");
