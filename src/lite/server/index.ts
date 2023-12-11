import Sync from "../../main/server/sync";
import Auth from "../../main/server/auth";
import Backend from "../../main/server/backend";
import PWA from "../../main/server/pwa";
import Basic from "../../main/server/basic";
import Proxy from "../../main/server/proxy";

// start it up!
Backend.server.start();
console.log(`FullStacked running at http://localhost:${Backend.server.port}`);

export const api = Backend.register(
    new PWA(),
    (process.env.PASS || process.env.AUTH_URL) && new Auth(),
    new Basic(),
    new Proxy(),
    new Sync()
);