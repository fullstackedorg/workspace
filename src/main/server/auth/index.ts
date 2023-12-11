import { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../backend";
import cookie from "cookie";
import { IncomingMessage, ServerResponse } from "http";
import { Auth } from "./auth";

export default class extends BackendTool {
    api = {
        async logout(this: { req: IncomingMessage, res: ServerResponse }) {
            const cookies = cookie.parse(this.req.headers.cookie ?? "");
    
            Auth.invalidateRefreshToken(cookies.fullstackedRefreshToken);
    
            const reqHost = (this.req.headers.origin || this.req.headers.host).replace(/https?:\/\//g, "");
            const reqHostname = reqHost.split(":").shift();
            this.res.setHeader("Set-Cookie", [
                cookie.serialize("fullstackedAccessToken", "", {
                    path: "/",
                    domain: reqHostname,
                    expires: new Date(0)
                }),
                cookie.serialize("fullstackedRefreshToken", "", {
                    path: "/",
                    domain: reqHostname,
                    httpOnly: true,
                    expires: new Date(0)
                })
            ]);
    
            if (process.env.REVOKE_URL) {
                return fetch(process.env.REVOKE_URL, {
                    headers: {
                        cookie: this.req.headers.cookie
                    }
                });
            }
        },
    };
    listeners: (Listener & { prefix?: string; })[] = [{
        prefix: "global",
        name: "Auth",
        handler: Auth.handler
    }];
    websocket: WebSocketRegisterer = {
        path: "/",
        handleUpgrade(req, socket, head) {
            // Authorized
            if (Auth.isRequestAuthenticated(req)) return false;

            // Unauthorized
            return new Promise(resolve => socket.end(() => resolve(true)));
        },
    };
}