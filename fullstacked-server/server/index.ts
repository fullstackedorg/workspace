import httpProxy from "http-proxy";
import fs from "fs";
import path from "path";
import Server from "fullstacked/server";
import cookie from "cookie";
import expressServer from "./express"

Server.port = 8000;

Server.start();

const {promisifiedListener, resolver} = Server.promisify(expressServer);
expressServer.use(resolver);
Server.addListener(promisifiedListener, true);


const proxy = httpProxy.createServer();

proxy.on("proxyRes", (proxyRes, req, res) => {
    if(proxyRes.headers["content-type"] === "text/html"){
        res.write("<script>" + fs.readFileSync(path.resolve(__dirname, "AppsMenu.js")) + "</script>");
    }
})

Server.addListener((req, res) => {
    const cookies = cookie.parse(req?.headers?.cookie ?? "");
    const appProxy = cookies.app;
    if(!appProxy) return;
    return new Promise<void>(resolve => {
        proxy.web(req, res, {target: `http://0.0.0.0:${appProxy}`}, () => {
            res.setHeader('Set-Cookie', cookie.serialize("app", "", {
                maxAge: -1
            }));
            resolve()
        });
    });
}, true);
