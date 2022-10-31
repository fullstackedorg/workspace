import Server from "fullstacked/server";
import {MongoClient} from 'mongodb';

const server = new Server();

server.addListener(async (req, res) => {
    if(req.url === "/mongo-test-connection"){
        const uri = "mongodb://root:test@mongo:27017";
        const client = new MongoClient(uri);

        console.log("ici");
        try {
            await client.connect();
        }catch (e){
            res.writeHead(500);
            return res.end("failed");
        }

        console.log("ici3");

        res.writeHead(200, {"content-type": "text/html"});
        res.write("success");
        res.end();
    }
});

server.start();
