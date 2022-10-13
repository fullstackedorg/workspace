import Server from "fullstacked/server";
import {MongoClient} from 'mongodb';

const server = new Server();

server.server.addListener("request", async (req, res) => {
    if(req.url === "/mongo-test-connection"){
        const uri = "mongodb://root:test@mongo:27017";
        const client = new MongoClient(uri);
        try {
            await client.connect();
        }catch (e){
            res.writeHead(500);
            return res.end("failed");
        }

        res.writeHead(200, {"content-type": "text/html"});
        res.write("success");
        res.end();
    }
});

server.start();
