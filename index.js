#!/usr/bin/env node
import {fork} from "child_process";
import {fileURLToPath} from "url";
import {dirname} from "path"
import {Socket} from "net";

const currentDir = dirname(fileURLToPath(import.meta.url));
const lastArg = process.argv.at(-1);

const portCodeOSS = await getNextAvailablePort(randomIntFromInterval(10000, 50000));
const processCodeOSS = fork(`${currentDir}/code-oss/out/server-main.js`, [
    "--without-connection-token",
    "--host", "0.0.0.0",
    "--port", portCodeOSS.toString()
], {stdio: "ignore"});

const portFullStacked = await getNextAvailablePort(8000);
const processFullStacked = fork(`${currentDir}/dist/server/index.mjs`,  {
    env: {
        ...process.env,
        NEUTRALINO: process.argv.includes("--neutralino") ? "1" : "0",
        FULLSTACKED_PORT: portFullStacked,
        CODE_OSS_PORT: portCodeOSS,
        FULLSTACKED_ENV: "production",
        RUNTIME_PATH: process.env.PATH,
        CLI_START: lastArg.endsWith("fullstacked") || lastArg.endsWith("fullstacked\\index.js")
            ? "1"
            : ""
    }
});

processFullStacked.on("exit", () => {
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

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}
