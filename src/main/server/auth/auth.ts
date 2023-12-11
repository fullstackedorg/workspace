import {randomUUID} from "crypto";
import cookie from "cookie";
import password from "./password";
import external from "./external";
import type {IncomingMessage, ServerResponse} from "http";

export class Auth {
    private static readonly authenticator = process.env.PASS
        ? password
        : external;

    private static readonly accessTokenDuration = 1000 * 60 * 15; // 15 minutes
    private static readonly refreshTokenDuration = 1000 * 60 * 60 * 24 * 2; // 2 days
    private static readonly cookieExpirationDuration = 1000 * 60 * 60 * 24 * 7 // 1 week

    // RefreshToken => Set<AccessToken>
    private static tokenIssued: Map<string, Set<string>> = new Map();

    // Singleton class
    private constructor() { }

    static isRequestAuthenticated(req: IncomingMessage) {
        const cookies = cookie.parse(req.headers.cookie ?? "");
        return Auth.isAccessTokenValid(cookies.fullstackedAccessToken);
    }

    static async handler(req: IncomingMessage, res: ServerResponse) {
        // Authorized
        if(Auth.isRequestAuthenticated(req)) return;

        if (req.method === "POST" && req.url === "/") {
            const cookies = cookie.parse(req.headers.cookie ?? "");
            let data = ""
            await new Promise((resolve) => {
                req.on('data', chunk => data += chunk.toString());
                req.on('end', resolve);
            });
            let body;
            try{
                body = data.trim() ? JSON.parse(data) : {};
            }catch (e) {
                console.log(data);
                throw e;
            }

            const cookiesToSend = [];
            const reqHost = (req.headers.origin || req.headers.host).replace(/https?:\/\//g, "");
            const reqHostname = reqHost.split(":").shift();

            const sendAccessToken = accessToken => {
                cookiesToSend.push(cookie.serialize("fullstackedAccessToken", accessToken, {
                    path: "/",
                    domain: reqHostname,
                    expires: new Date(Date.now() + Auth.cookieExpirationDuration)
                }));
            }

            let refreshToken = cookies.fullstackedRefreshToken;
            let newAccessToken;

            if(refreshToken){
                newAccessToken = Auth.issueAccessToken(refreshToken, cookies.fullstackedAccessToken);
                if(newAccessToken){
                    sendAccessToken(newAccessToken);
                }
            }

            if (!newAccessToken) {
                let validation
                try{
                    validation = await Auth.authenticator.validator(req, body);
                }catch (e){
                    validation = e;
                }

                if(!validation || validation instanceof Error){
                    res.writeHead(500);
                    res.write(validation.toString());
                    res.end();
                    return;
                }

                if(validation){
                    refreshToken = Auth.issueRefreshToken();
                    const accessToken = Auth.issueAccessTokenWithoutOldAccessToken(refreshToken);
                    sendAccessToken(accessToken);
                }
            }

            if(Auth.isRefreshTokenValid(refreshToken)){
                cookiesToSend.push(cookie.serialize("fullstackedRefreshToken", refreshToken, {
                    path: "/",
                    domain: reqHostname,
                    httpOnly: true,
                    expires: new Date(Date.now() + Auth.cookieExpirationDuration)
                }));
            }

            if(cookiesToSend.length){
                res.setHeader("Set-Cookie", cookiesToSend);
            }

            res.end("Bonjour");
            return;
        }

        res.setHeader("Content-Type", "text/html");
        res.end(Auth.authenticator.html.toString());
    }

    private static isRefreshTokenValid (refreshToken: string) {
        if(!refreshToken || !Array.from(Auth.tokenIssued.keys()).includes(refreshToken))
            return false;

        const refreshTokenComponents = refreshToken.split(":");
        if(refreshTokenComponents.length !== 2){
            Auth.tokenIssued.delete(refreshToken);
            return false;
        }

        const expiration = parseInt(refreshTokenComponents.pop());
        if(!expiration || isNaN(expiration)) {
            Auth.tokenIssued.delete(refreshToken)
            return false;
        }

        const isExpired = expiration < Date.now();
        if(isExpired) {
            Auth.tokenIssued.delete(refreshToken)
        }

        return !isExpired;
    }

    private static issueRefreshToken(){
        const expires = Date.now() + Auth.refreshTokenDuration;
        const refreshToken = randomUUID() + ":" + expires;
        Auth.tokenIssued.set(refreshToken, new Set());
        return refreshToken;
    }

    private static validateAccessToken(accessToken: string){
        if(!accessToken)
            return false;

        const accessTokenComponents = accessToken.split(":");
        if(accessTokenComponents.length !== 2){
            return false;
        }

        const expiration = parseInt(accessTokenComponents.pop());
        if(!expiration || isNaN(expiration)) {
            return false;
        }

        return expiration > Date.now();
    }

    private static isAccessTokenValid(accessToken: string){
        return Array.from(Auth.tokenIssued.values())
            .find(issuedAccessTokens =>
                issuedAccessTokens.has(accessToken) && Auth.validateAccessToken(accessToken));
    }

    private static issueAccessTokenWithoutOldAccessToken (refreshToken: string) {
        if(!refreshToken || !Auth.isRefreshTokenValid(refreshToken))
            return null;

        const issuedAccessTokens = Auth.tokenIssued.get(refreshToken);

        const expires = Date.now() + Auth.accessTokenDuration;
        const accessToken = randomUUID() + ":" + expires;
        issuedAccessTokens.add(accessToken);

        return accessToken;
    }

    static issueAccessToken (refreshToken: string, oldAccessToken: string) {
        if(!refreshToken || !Auth.isRefreshTokenValid(refreshToken))
            return null;

        const issuedAccessTokens = Auth.tokenIssued.get(refreshToken);

        if(!issuedAccessTokens.has(oldAccessToken)){
            return null;
        }

        const expires = Date.now() + Auth.accessTokenDuration;
        const accessToken = randomUUID() + ":" + expires;
        issuedAccessTokens.add(accessToken);

        return accessToken;
    }

    static invalidateRefreshToken(refreshToken: string){
        Auth.tokenIssued.delete(refreshToken);
    }
}
