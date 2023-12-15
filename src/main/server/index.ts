import Auth from "./auth";
import Terminal from "./terminal";
import open from "open";
import fs from "fs";
import Sync from "./sync";
import Backend from './backend';
import CodeOSS from './codeOSS';
import GitHubDeviceFlow from './github';
import Basic from './basic';
import Proxy from "./proxy"
import PWA from './pwa';
import Apps from "./apps";

// when not in watch mode
// watch mode is when developing the workspace
const WATCH_MODE = process.argv.includes("watch");
if (!WATCH_MODE) {
    // and production mode
    if (process.env.FULLSTACKED_ENV === "production") {
        // remove request logger
        Backend.server.logger = null;

        // cache static file when not started from the CLI
        if (!process.env.NPX_START)
        Backend.server.staticFilesCacheControl = "max-age=900";
    }

    // set the port defined by main process
    if (process.env.FULLSTACKED_PORT)
        Backend.server.port = parseInt(process.env.FULLSTACKED_PORT);
}

// try to load the html injection
const injectionFileURL = new URL(import.meta.url);
const pathComponents = injectionFileURL.pathname.split("/");
pathComponents.splice(-1, 1, "html", "injection.html");
injectionFileURL.pathname = pathComponents.join("/");
if (fs.existsSync(injectionFileURL)) {
    Backend.server.pages["/"].addInBody(fs.readFileSync(injectionFileURL).toString());
}

// start it up!
await Backend.server.start(true);
console.log(`FullStacked running at http://localhost:${Backend.server.port}`);

// open browser directly from CLI start
if (process.env.NPX_START) {
    open(`http://localhost:${Backend.server.port}`);
}

// useful for `fsc watch` and electron import
export default Backend.server;

export const api = Backend.register(
    new PWA(),
    (process.env.PASS || process.env.AUTH_URL) && new Auth(),
    new Basic(),
    new Apps(),
    !WATCH_MODE && new Proxy(),
    new CodeOSS(),
    process.env.DOCKER_RUNTIME && new GitHubDeviceFlow(),
    new Terminal(),
    new Sync()
);