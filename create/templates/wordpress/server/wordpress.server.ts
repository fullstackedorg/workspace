import httpProxy from "http-proxy";
import Server from "fullstacked/server";

const proxy = httpProxy.createServer();

Server.listeners.unshift({
    title: "WordPress proxy",
    handler(req, res) {
        if (!req.headers.host.startsWith("wp.")) return;
        return new Promise<void>(resolve => {
            proxy.web(req, res, {target: "http://wordpress"}, resolve);
        });
    }
});
