import {WebSocket, WebSocketServer} from "ws";
import PTy, {IPty} from "node-pty";
import {IncomingMessage} from "http";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { platform } from "os";


type Session = {
    pty: IPty,
    ws: WebSocket,
    lastActivity: number,
    data: string[]
}

const isWin = platform() === 'win32';
const shell = isWin ? 'powershell.exe' : '/bin/sh';
const args  = isWin ? [] : ['-l'];
process.env.PATH += isWin
    ? ";" + dirname(fileURLToPath(import.meta.url)) + "\\bat"
    : ":" + dirname(fileURLToPath(import.meta.url)) + "/bin";

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
            const pty = PTy.spawn(shell, args, {
                name: '',
                cols: 80,
                rows: 30,
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    SESSION_ID
                }
            });

            pty.onData((data) => {
                const terminalSession = this.sessions.get(SESSION_ID);
                if(!terminalSession) return;

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


// C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\Program Files\Git\cmd;C:\Program Files\dotnet\;C:\Program Files\Common Files\Autodesk Shared\;C:\Program Files\Microsoft SQL Server\120\Tools\Binn\;C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\nodejs\;C:\Program Files\PowerShell\7\;C:\Users\CP\AppData\Local\Microsoft\WindowsApps;C:\Users\CP\.deno\bin;C:\Users\CP\AppData\Local\Programs\Python\Python311;C:\Users\CP\.dotnet\tools;C:\Users\CP\AppData\Roaming\npm
// C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\Program Files\Git\cmd;C:\Program Files\dotnet\;C:\Program Files\Common Files\Autodesk Shared\;C:\Program Files\Microsoft SQL Server\120\Tools\Binn\;C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\nodejs\;C:\Program Files\PowerShell\7\;C:\Users\CP\AppData\Local\Microsoft\WindowsApps;C:\Users\CP\.deno\bin;C:\Users\CP\AppData\Local\Programs\Python\Python311;C:\Users\CP\.dotnet\tools;C:\Users\CP\AppData\Roaming\npm;C:\Users\CP\Desktop\Projets\fullstackedorg\workspace\node_modules\.bin
// C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\Program Files\Git\cmd;C:\Program Files\dotnet\;C:\Program Files\Common Files\Autodesk Shared\;C:\Program Files\Microsoft SQL Server\120\Tools\Binn\;C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\nodejs\;C:\Program Files\PowerShell\7\;C:\Users\CP\AppData\Local\Microsoft\WindowsApps;C:\Users\CP\.deno\bin;C:\Users\CP\AppData\Local\Programs\Python\Python311;C:\Users\CP\.dotnet\tools;C:\Users\CP\AppData\Roaming\npm;C:\Users\CP\Desktop\Projets\fullstackedorg\workspace\node_modules\.bin
