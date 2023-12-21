import httpProxy from "http-proxy";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { Listener } from "@fullstacked/webapp/server";
import { IncomingMessage } from "http";
import { Duplex } from "stream";

const subdomainPortProxy = httpProxy.createProxy();

subdomainPortProxy.on('proxyRes', proxyRes => {
    // remove headers that block iframe display
    delete proxyRes.headers["content-security-policy"];
    delete proxyRes.headers["x-frame-options"];
});

export default class extends BackendTool {
    api = {};

    listeners: (Listener & { prefix?: string; })[] = [
        {
            // a url will look like : https://8080.fullstacked.cloud
            // grab the first part [8080]
            // and reverse proxy there
            name: "Proxy",
            prefix: "global",
            handler(req, res) {
                const maybePort = maybePortFromSubdomain(req);

                if (!maybePort)
                    return;

                return new Promise<void>(resolve => {
                    // assures us that the promise will resolve
                    // in this case, with the response ending
                    res.on("end", resolve);

                    const errorCallback = () => {
                        res.end(`Failed to Proxy Port [${maybePort}]`);
                    }

                    subdomainPortProxy.web(req, res, { target: `http://0.0.0.0:${maybePort}` }, errorCallback);
                });
            }
        }
    ];

    websocket: WebSocketRegisterer = {
        path: "/",
        handleUpgrade(req, socket, head) {
            const maybePort = maybePortFromSubdomain(req);

            if (!maybePort)
                return false;

            const errorCallback = () => {
                socket.end();
            }

            subdomainPortProxy.ws(req, socket, head, { target: `http://0.0.0.0:${maybePort}` }, errorCallback);
            return true;
        }
    };
}

function maybePortFromSubdomain(req: IncomingMessage) {
    const domainParts = req.headers.host.split(".");
    const firstDomainPart = domainParts.shift();
    const maybeNumPort = parseInt(firstDomainPart);

    // whether maybePort is not a number, is under 3000 (to avoid touching os level ports)
    // or is a number over 2 bytes
    return maybeNumPort.toString() !== firstDomainPart || maybeNumPort < 3000 || maybeNumPort > 65535
        ? 0
        : maybeNumPort;
}