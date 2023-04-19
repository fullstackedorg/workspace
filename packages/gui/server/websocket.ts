import WebSocket, {WebSocketServer} from "ws";
import * as http from "http";

const wss = new WebSocketServer({ noServer: true });
const activeWS = new Set<WebSocket>();

wss.on("connection", (ws) => {
    activeWS.add(ws);
    ws.on('close', () => activeWS.delete(ws));
});

console.log = (...args) => {
    activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: "LOG",
            data: args.join(" ")
        }));
    })
}

export const bindCommandToWS = (command) => {
    command.write = (str) => activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: "LOG",
            data: str
        }));
    });

    command.printLine = (str) => activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: "LINE",
            data: str
        }));
    });

    command.endLine = () => activeWS.forEach(ws => {
        ws.send(JSON.stringify({
            type: "END_LINE"
        }));
    });
}

export default function (server: http.Server){
    server.on('upgrade', (request, socket, head) => {
        if(request.url !== "/fullstacked-gui") return;

        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    });
}
