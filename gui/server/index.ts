import Server from "../../Server";
import {IncomingMessage} from "http";

const endpoints = [
    {
        path: "/ssh",
        callback: (req) => {
            console.log(req.body);
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

        endpoint.callback(req);
    }
});
