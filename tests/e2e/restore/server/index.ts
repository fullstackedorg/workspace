import Server from "../../../../server";
import { createClient } from 'redis';

(async () => {
    const url = "redis://redis:6379";
    const client = createClient({url});
    await client.connect()

    Server.listeners.push({
        async handler(req, res){
            if(req.url !== "/post" || req.method !== "POST") return;

           await client.rPush("test", Math.floor(Math.random() * 1000000).toString());
           await client.save();

            res.writeHead(200, {"content-type": "application/json"});
            res.write("Success");
            res.end();
        }
    });

    Server.listeners.push({
        async handler(req, res){
            if(req.url !== "/get") return;


            res.writeHead(200, {"content-type": "application/json"});
            res.write(JSON.stringify(await client.lRange("test", 0, -1)));
            res.end();
        }
    });
})()
