import {WebSocket, WebSocketServer} from "ws";
import PTy, {IPty} from "node-pty";
import {IncomingMessage} from "http";
import { dirname } from "path";
import { fileURLToPath } from "url";


type Session = {
    pty: IPty,
    ws: WebSocket,
    lastActivity: number,
    data: string[]
}

export class Terminal {
    static killTimeout = 1000 * 60 * 15 // 15 minutes

    webSocketServer = new WebSocketServer({noServer: true});
    sessions: Map<string, Session> = new Map();

    constructor() {
        this.startCleanupInterval();
        this.webSocketServer.on('connection', this.onConnection.bind(this));
    }

    startCleanupInterval(){
        setInterval(() => {
            for(const [SESSION_ID, {pty, ws, lastActivity}] of this.sessions.entries()){
                if(Date.now() - lastActivity > Terminal.killTimeout){
                    pty.kill();
                    ws.close()
                    this.sessions.delete(SESSION_ID);
                }
            }
        }, 1000 * 60) // every minute
    }

    onConnection(ws: WebSocket, req: IncomingMessage){
        let SESSION_ID: string;

        // find existing
        const reqComponents = req.url.split("/").filter(Boolean);
        let session: Session;
        if(reqComponents.length > 1) {
            SESSION_ID = reqComponents.pop();
            session = this.sessions.get(SESSION_ID);
        }

        // create new
        if(!session) {
            SESSION_ID = Math.floor(Math.random() * 1000000).toString();
            const pty = PTy.spawn("/bin/sh", ["-l"], {
                name: '',
                cols: 80,
                rows: 30,
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    SESSION_ID,
                    PATH: dirname(fileURLToPath(import.meta.url)) + "/bin:" + process.env.PATH.replace(/%3A/g, ":")
                }
            });

            pty.onData((data) => {
                const terminalSession = this.sessions.get(SESSION_ID);
                if(terminalSession.ws.readyState === terminalSession.ws.CLOSED) {
                    terminalSession.data.push(data);
                }else{
                    terminalSession.ws.send(data);
                    terminalSession.lastActivity = Date.now();
                }
            });

            session = {
                pty,
                ws,
                lastActivity: Date.now(),
                data: []
            }
        }else{
            session.ws = ws;
        }

        // send accumulated data
        session.data.forEach(chunk => ws.send(chunk));
        session.data = [];

        // send session id
        this.sessions.set(SESSION_ID, session);
        ws.send(`SESSION_ID#${SESSION_ID}`)

        ws.on('message', data => {
            const dataStr = data.toString();
            if(dataStr.startsWith("SIZE#")){
                const [_, cols, rows] = dataStr.split("#");
                session.pty.resize(parseInt(cols), parseInt(rows));
                return;
            }
            session.pty.write(dataStr);
        });
    }
}
