import httpProxy from "http-proxy";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { Listener } from "@fullstacked/webapp/server";

// reverse proxy code OSS
//
// I used to simply display it in an iframe and it was working great!
// But on iPad Pro, scrolling in iframes is very shitty,
// so scrolling in the code editor wasnt working -.-
// Managed to sort of hack a way to lazy load Code OSS on premise within the main window
// by reverse proxying and merging it's html response to the main app HTML
const proxyCodeOSS = httpProxy.createProxy({ target: `http://0.0.0.0:${process.env.CODE_OSS_PORT}` });

// throws on windows...
proxyCodeOSS.removeAllListeners("error");

export default class extends BackendTool {
    api = {
        hasCodeOSS: () => !!process.env.CODE_OSS_PORT
    };

    listeners: (Listener & { prefix?: string; })[] = [{
        prefix: "/oss-dev",
        handler(req, res) {
            if (req.url)
                req.url = "/oss-dev" + req.url;

            proxyCodeOSS.web(req, res, undefined)
        }
    }];

    websocket: WebSocketRegisterer = {
        path: "/oss-dev",
        handleUpgrade(req, socket, head) {
            proxyCodeOSS.ws(req, socket, head);
            return true;
        }
    };
}
