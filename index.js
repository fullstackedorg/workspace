#!/usr/bin/env node
import {existsSync} from "fs";
import {fork} from "child_process";
import {fileURLToPath} from "url";
import {dirname} from "path"
import {Socket} from "net";

const currentDir = dirname(fileURLToPath(import.meta.url));
const lastArg = process.argv.at(-1);

const dirCodeOSS = `${currentDir}/code-oss`
const entrypointCodeOSS =  `${dirCodeOSS}/out/server-main.js`;

let portCodeOSS, processCodeOSS;
if(existsSync(entrypointCodeOSS) && existsSync(dirCodeOSS + "/node_modules")){
    portCodeOSS = await getNextAvailablePort(10000);
    processCodeOSS = fork(entrypointCodeOSS, [
        "--without-connection-token",
        "--host", "0.0.0.0",
        "--port", portCodeOSS.toString()
    ], {stdio: "inherit"});
}

const portFullStacked = process.env.FULLSTACKED_PORT || await getNextAvailablePort(8000);
const processFullStacked = fork(`${currentDir}/dist/server/index.mjs`,  {
    env: {
        ...process.env,
        FULLSTACKED_PORT: portFullStacked,
        CODE_OSS_PORT: portCodeOSS,
        FULLSTACKED_ENV: "production",
        RUNTIME_PATH: process.env.PATH,
        NPX_START: lastArg.endsWith("fullstacked") || lastArg.endsWith("fullstacked\\index.js")
            ? "1"
            : ""
    }
});

processFullStacked.on("exit", () => {
    if(processCodeOSS)
        processCodeOSS.kill();
    process.exit();
});


function getNextAvailablePort(port) {
    return new Promise((resolve, reject) => {
        const socket = new Socket();

        const timeout = () => {
            resolve(port);
            socket.destroy();
        };

        const next = () => {
            socket.destroy();
            resolve(getNextAvailablePort(++port));
        };

        setTimeout(timeout, 200);
        socket.on("timeout", timeout);

        socket.on("connect", function () {
            next();
        });

        socket.on("error", function (exception) {
            if (exception.code !== "ECONNREFUSED") {
                reject(exception);
            } else {
                timeout();
            }
        });

        socket.connect(port, "0.0.0.0");
    });
}
