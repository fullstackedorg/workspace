import Server from "fullstacked/server";
import {MongoClient} from 'mongodb';

const server = new Server();

server.express.get("/mongo-test-connection", async (req, res) => {
    const uri = "mongodb://root:test@mongo:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
    }catch (e){ res.send("failed") }
    res.send("success");
});

server.start();
