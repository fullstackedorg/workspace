import Server from "@fullstacked/webapp/server"
import httpProxy from "http-proxy";

const {web} = httpProxy.createServer();

Server.addListener("/wordpress", {
    title: "WordPress",
    handler(req, res) {
        web(req, res, {target: "http://wordpress"});
    }
});
