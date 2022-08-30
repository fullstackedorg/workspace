import {IncomingMessage, Server} from "http";
import {WebSocketServer, WebSocket} from "ws";

export default class {
    path = "/watcher";
    filter: (request: IncomingMessage) => boolean;
    ws = new Set<WebSocket>();

    init(server: Server){
        const wss = new WebSocketServer({ noServer: true });
        wss.on("connection", (ws) => {
            ws.onmessage = () => {
                this.ws.forEach(connectedWS => {
                    if(connectedWS === ws) return;

                    connectedWS.send(Date.now());
                });
            }

            this.ws.add(ws);
        });

        server.on('upgrade', (request, socket, head) => {
            if(!request.url.startsWith(this.path) || (this.filter && !this.filter(request)))
                return;

            wss.handleUpgrade(request, socket, head, function done(ws) {
                wss.emit('connection', ws, request);
            });
        });
    }
}
