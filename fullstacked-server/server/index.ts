import Server from "fullstacked/server";
import { Low } from 'lowdb'
// @ts-ignore
import { JSONFile } from 'lowdb/node'
import httpProxy from "http-proxy";
import path from "path";
import cookie from "cookie";
import fs from "fs";

Server.port = 8000;

Server.start();

async function readBody(req){
    return new Promise<any>(resolve => {
        let data = "";
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(JSON.parse(data)));
    });
}

const adapter = new JSONFile(path.resolve("/data", "db.json"));
const db: any = new Low(adapter);

(async () => {
    await db.read();
    db.data ||= { apps: {} };
})()


const endpoints = [
    {
        path: "/apps",
        method: "GET",
        callback: async (req) => {
            return db.data.apps;
        }
    },
    {
        path: "/apps",
        method: "POST",
        callback: async (req) => {
            const body = await readBody(req);
            db.data.apps[body.label] = body.port;
            await db.write();
            return {};
        }
    }
]

Server.addListener(async (req, res) => {
    for(const endpoint of endpoints){
        if(res.headersSent) return;

        if(req.url === endpoint.path && req.method === endpoint.method){
            res.writeHead(200, "content-type: application/json");
            res.end(JSON.stringify(await endpoint.callback(req)));
        }
    }
});


const proxy = httpProxy.createServer();

proxy.on("proxyRes", (proxyRes, req, res) => {
    if(proxyRes.headers["content-type"] === "text/html"){
        res.write("<script>" + fs.readFileSync(path.resolve(__dirname, "AppsMenu.js")) + "</script>");
    }
})

Server.addListener((req, res) => {
    const cookies = cookie.parse(req?.headers?.cookie ?? "");
    const appProxy = db.data.apps[cookies?.app];
    if(!appProxy) return;
    return new Promise<void>(resolve => {
        proxy.web(req, res, {target: appProxy}, resolve as any);
    });
}, true);

