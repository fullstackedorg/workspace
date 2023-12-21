import { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { TerminalPTy } from "./pty";

export default class extends BackendTool {
    api = {
        killTerminalSession(SESSION_ID: string) {
            const session = TerminalPTy.sessions.get(SESSION_ID);
            if (session) {
                session.pty.kill()
                session.ws.close();
                TerminalPTy.sessions.delete(SESSION_ID);
            }
        }
    };
    listeners: (Listener & { prefix?: string; })[];
    websocket: WebSocketRegisterer = {
        path: "/fullstacked-terminal",
        onConnection: TerminalPTy.startOrResumeSessionWithRequest
    };
}