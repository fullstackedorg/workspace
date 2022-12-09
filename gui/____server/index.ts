import Server from "../../Server";
import {IncomingMessage} from "http";
import ssh from "./ssh";

const endpoints = [
    {
        path: "/ssh",
        callback: async (req, res) => {
            res.writeHead(200);
            res.write(await ssh(req.body));
            res.end();
        }
    }
]

function readBody(req){
    return new Promise<any>(resolve => {
        let data = "";
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(JSON.parse(data)));
    });
}

Server.addListener(async (req: IncomingMessage & {body: any}, res) => {
    for(const endpoint of endpoints) {
        if(endpoint.path !== req.url || res.headersSent) continue;

        if(req.method === "POST")
            req.body = await readBody(req);

        await endpoint.callback(req, res);
    }
});
