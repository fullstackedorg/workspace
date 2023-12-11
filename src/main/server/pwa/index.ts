import { Listener } from "@fullstacked/webapp/server";
import Backend, { BackendTool, WebSocketRegisterer } from "../backend";

const publicFiles = [
    "/pwa/manifest.json",
    "/pwa/app-icons/favicon.png",
    "/pwa/app-icons/app-icon.png",
    "/pwa/app-icons/maskable.png"
];

export default class extends BackendTool {
    constructor(){
        super();

        const html = Backend.server.pages["/"];
        html.addInHead(`
<link rel="icon" type="image/png" href="/pwa/app-icons/favicon.png">
<link rel="manifest" href="/pwa/manifest.json" crossorigin="use-credentials">
<meta name="theme-color" content="#171f2e"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`);
        html.addInHead(`<title>FullStacked</title>`);
        html.addInHead(`<link rel="apple-touch-icon" href="/pwa/app-icons/maskable.png">`);
        html.addInHead(`<meta name="apple-mobile-web-app-title" content="FullStacked">`);
        html.addInHead(`<link rel="apple-touch-startup-image" href="/pwa/app-icons/app-icon.png">`);
        html.addInHead(`<meta name="apple-mobile-web-app-capable" content="yes">`);
        html.addInHead(`<meta name="apple-mobile-web-app-status-bar-style" content="#2c2f33">`);
    }


    api = {};
    listeners: (Listener & { prefix?: string; })[] = [{
        prefix: "global",
        name: "PWA public files",
        handler(req, res) {
            if (!publicFiles.includes(req.url)) return;
            return Backend.server.staticFilesAndPagesHandler(req, res);
        }
    }, {
        prefix: "global",
        name: "Service Worker",
        handler(req, res){
            if (req.url !== "/service-worker.js") 
                return;
            res.setHeader("Content-Type", "application/javascript");
            res.end(`self.addEventListener('fetch', (event) => {});`);
        }
    }];
    websocket: WebSocketRegisterer;

}