import {WebSocket} from "ws";
import PTy, {IPty} from "node-pty";
import {IncomingMessage} from "http";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {homedir, platform} from "os";
import {Sync} from "../sync/sync";
import {execSync} from "child_process";

type Session = {
    pty: IPty,
    ws: WebSocket,
    lastActivity: number,
    data: string[]
}

const isWin = platform() === "win32";
const isMac = platform() === "darwin";
const shell = isWin
    ? "powershell.exe"
    : isMac
        ? "/bin/zsh"
        : "/bin/bash";
const args  = isWin ? [] : ['-l'];
process.env.PATH += isWin
    ? ";" + dirname(fileURLToPath(import.meta.url)) + "\\bat"
    : ":" + dirname(fileURLToPath(import.meta.url)) + "/bin";

if(!isWin){
    execSync(`chmod +x ${dirname(fileURLToPath(import.meta.url)) + "/bin/*"}`);
}


export class TerminalPTy {
    static killTimeout = 1000 * 60 * 15 // 15 minutes

    static sessions: Map<string, Session> = new Map();

    // singleton class
    private constructor () {}

    private static cleanupIntervalRunning = false;
    static startCleanupInterval(){
        if(TerminalPTy.cleanupIntervalRunning) 
            return;
        TerminalPTy.cleanupIntervalRunning = true;

        setInterval(() => {
            for(const [SESSION_ID, {pty, ws, lastActivity}] of TerminalPTy.sessions.entries()){
                if(Date.now() - lastActivity > TerminalPTy.killTimeout){
                    pty.kill();
                    ws.close()
                    TerminalPTy.sessions.delete(SESSION_ID);
                }
            }
        }, 1000 * 60) // check every minute
    }

    static startOrResumeSessionWithRequest(ws: WebSocket, request: IncomingMessage){
        TerminalPTy.startCleanupInterval();

        let SESSION_ID: string;

        // find existing
        const reqComponents = request.url.split("/").filter(Boolean);
        let session: Session;
        if(reqComponents.length > 1) {
            SESSION_ID = reqComponents.pop();
            session = TerminalPTy.sessions.get(SESSION_ID);
        }

        // create new
        if(!session) {
            SESSION_ID = Math.floor(Math.random() * 1000000).toString();
            const pty = PTy.spawn(shell, args, {
                name: '',
                cols: 80,
                rows: 30,
                cwd: Sync.config?.directory || homedir(),
                env: {
                    ...process.env,
                    SESSION_ID
                }
            });

            pty.onData((data) => {
                const terminalSession = TerminalPTy.sessions.get(SESSION_ID);
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
        TerminalPTy.sessions.set(SESSION_ID, session);
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