#!/usr/bin/env node
import {fork} from "child_process";
import {fileURLToPath} from "url";
import {dirname} from "path"

const currentDir = dirname(fileURLToPath(import.meta.url));
const lastArg = process.argv.at(-1);

fork(`${currentDir}/dist/server/index.mjs`, {
    env: {
        ...process.env,
        FULLSTACKED_ENV: "production",
        RUNTIME_PATH: process.env.PATH,
        CLI_START: lastArg.endsWith("fullstacked") || lastArg.endsWith("fullstacked\\index.js")
            ? "1"
            : ""
    }
});

fork(`${currentDir}/code-oss/out/server-main.js`, [
    "--without-connection-token",
    "--host", "0.0.0.0",
    "--port", "8888"
]);
