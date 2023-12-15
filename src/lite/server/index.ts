import "./env";
import "./fetch";
import Sync from "../../main/server/sync";
import Auth from "../../main/server/auth";
import Backend from "../../main/server/backend";
import PWA from "../../main/server/pwa";
import Basic from "../../main/server/basic";
import Proxy from "../../main/server/proxy";
import Apps from "../../main/server/apps";

if(process.env.FULLSTACKED_PORT)
    Backend.server.port = parseInt(process.env.FULLSTACKED_PORT);

// start it up!
await Backend.server.start(true);
console.log(`FullStacked running at http://localhost:${Backend.server.port}`);

export const api = Backend.register(
    new PWA(),
    (process.env.PASS || process.env.AUTH_URL) && new Auth(),
    new Basic(),
    new Apps(),
    new Proxy(),
    new Sync()
);

export default Backend.server;