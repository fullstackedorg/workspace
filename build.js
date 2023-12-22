import Build from "@fullstacked/build";
import { cpSync, rmSync } from "fs";

rmSync("dist", {recursive: true});

Build.fullstackedNodeDockerComposeSpec = null;

delete process.env.FULLSTACKED_PORT;

const main = new Build();
main.config.client = "src/main/client/index.ts";
main.config.server = "src/main/server/index.ts";
// main.config.production = true;
main.config.outputDir = "dist/main";
main.externalModules.push("node-pty")


const lite = new Build();
lite.config.client = "src/lite/client/index.ts";
lite.config.server = "src/lite/server/index.ts";
// lite.config.production = true;
lite.config.outputDir = "dist/lite";

const electron = new Build();
electron.config.client = "src/lite/client/index.ts";
electron.config.server = "electron/index.ts"
// lite.config.production = true;
electron.config.outputDir = "electron/dist";
electron.externalModules.push("electron");

await Promise.all([
    main.run(),
    lite.run(),
    electron.run()
]);

const directoriesToCopy = [
    ["pwa", "dist/main/client/pwa"],
    ["pwa", "dist/lite/client/pwa"],
    ["src/main/server/terminal/bin", "dist/main/server/bin"],
    ["src/main/server/terminal/bat", "dist/main/server/bat"]
]

directoriesToCopy.forEach(([from, to]) => {
    cpSync(from, to, { recursive: true });
});

