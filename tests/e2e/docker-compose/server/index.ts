import Server from "../../../../server";
import {MongoClient} from 'mongodb';

Server.listeners.push({
    async handler(req, res) {
        if(req.url !== "/mongo-test-connection") return ;

        const uri = "mongodb://root:test@mongo:27017";
        const client = new MongoClient(uri);

        try {
            await client.connect();
        }catch (e){
            res.writeHead(500);
            res.end("failed");
            return;
        }

        res.writeHead(200, {"content-type": "text/html"});
        res.write("success");
        res.end();
    }
});
