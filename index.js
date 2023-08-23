import {fork} from "child_process";
import {fileURLToPath} from "url";
import {dirname} from "path"

const currentDir = dirname(fileURLToPath(import.meta.url));

fork(`${currentDir}/dist/server/index.mjs`, {
    env: {
        ...process.env,
        FULLSTACKED_ENV: "production"
    }
});

