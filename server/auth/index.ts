import {randomUUID} from "crypto";
import cookie from "cookie";
import password from "./password";
import external from "./external";
import type {ServerResponse} from "http";
import {IncomingMessage} from "http";

export default class {
    private readonly authenticator = process.env.PASS
        ? password
        : external;

    private readonly accessTokenDuration = 1000 * 60 * 15; // 15 minutes
    private readonly refreshTokenDuration = 1000 * 60 * 60 * 24 * 7; // 1 week

    // RefreshToken => Set<AccessToken>
    private tokenIssued: Map<string, Set<string>> = new Map();

    isRequestAuthenticated(req: IncomingMessage) {
        const cookies = cookie.parse(req.headers.cookie ?? "");
        return this.isAccessTokenValid(cookies.fullstackedAccessToken);
    }

    async handler(req, res: ServerResponse) {
        if(this.isRequestAuthenticated(req)) return;

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

            const sendAccessToken = (accessToken) => {
                cookiesToSend.push(cookie.serialize("fullstackedAccessToken", accessToken, {
                    path: "/",
                    domain: reqHostname
                }));
            }

            let refreshToken = cookies.fullstackedRefreshToken,
                newAccessToken;
            if(refreshToken){
                newAccessToken = this.issueAccessToken(refreshToken, cookies.fullstackedAccessToken);
                if(newAccessToken){
                    sendAccessToken(newAccessToken);
                }
            }

            if (!newAccessToken) {
                let validation
                try{
                    validation = await this.authenticator.validator(req, body);
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
                    refreshToken = this.issueRefreshToken();
                    const accessToken = this.issueAccessTokenWithoutOldAccessToken(refreshToken);

                    sendAccessToken(accessToken);
                }
            }

            if(this.isRefreshTokenValid(refreshToken)){
                cookiesToSend.push(cookie.serialize("fullstackedRefreshToken", refreshToken, {
                    path: "/",
                    domain: reqHostname,
                    httpOnly: true
                }));
            }

            if(cookiesToSend.length){
                res.setHeader("Set-Cookie", cookiesToSend);
            }

            res.end("Bonjour");
            return;
        }

        res.setHeader("Content-Type", "text/html");
        res.end(this.authenticator.html.toString());
    }

    private isRefreshTokenValid (refreshToken: string) {
        if(!refreshToken || !Array.from(this.tokenIssued.keys()).includes(refreshToken))
            return false;

        const refreshTokenComponents = refreshToken.split(":");
        if(refreshTokenComponents.length !== 2){
            this.tokenIssued.delete(refreshToken);
            return false;
        }

        const expiration = parseInt(refreshTokenComponents.pop());
        if(!expiration || isNaN(expiration)) {
            this.tokenIssued.delete(refreshToken)
            return false;
        }

        const isExpired = expiration < Date.now();
        if(isExpired) {
            this.tokenIssued.delete(refreshToken)
        }

        return !isExpired;
    }

    private issueRefreshToken(){
        const refreshToken = randomUUID() + ":" + (Date.now() + this.refreshTokenDuration);
        this.tokenIssued.set(refreshToken, new Set());
        return refreshToken;
    }

    private validateAccessToken(accessToken: string){
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

    private isAccessTokenValid(accessToken: string){
        return Array.from(this.tokenIssued.values())
            .find(issuedAccessTokens =>
                issuedAccessTokens.has(accessToken) && this.validateAccessToken(accessToken));
    }

    private issueAccessTokenWithoutOldAccessToken (refreshToken: string) {
        if(!refreshToken || !this.isRefreshTokenValid(refreshToken))
            return null;

        const issuedAccessTokens = this.tokenIssued.get(refreshToken);

        const accessToken = randomUUID() + ":" + (Date.now() + this.accessTokenDuration);
        issuedAccessTokens.add(accessToken);

        return accessToken;
    }

    issueAccessToken (refreshToken: string, oldAccessToken: string) {
        if(!refreshToken || !this.isRefreshTokenValid(refreshToken))
            return null;

        const issuedAccessTokens = this.tokenIssued.get(refreshToken);

        if(!issuedAccessTokens.has(oldAccessToken)){
            return null;
        }

        const accessToken = randomUUID() + ":" + (Date.now() + this.accessTokenDuration);
        issuedAccessTokens.add(accessToken);

        return accessToken;
    }

    invalidateRefreshToken(refreshToken: string){
        this.tokenIssued.delete(refreshToken);
    }
}
