import {WebSocketServer} from "ws";
import fs from "fs";
import http from "http";
import path from "path";

const wss = new WebSocketServer({server: http.createServer().listen(8001, "0.0.0.0")});
wss.on("connection", (ws) => {
    const interval = setInterval(() => {
        const stats = fs.statSync(path.resolve(__dirname, "public/index.html"));
        ws.send(stats.mtimeMs);
    }, 500);
    ws.onclose = () => clearInterval(interval);
});

console.log('\x1b[33m%s\x1b[0m', "Watching");
