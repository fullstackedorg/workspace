import Server from "@fullstacked/webapp/server"
import httpProxy from "http-proxy";

const proxy = httpProxy.createServer();

Server.addListener("/wordpress", {
    name: "WordPress",
    handler(req, res) {
        proxy.web(req, res, {target: "http://wordpress"});
    }
});
