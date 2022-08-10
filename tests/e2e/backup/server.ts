import Server from "fullstacked/server";
import {MongoClient} from 'mongodb';

const server = new Server();

server.start({}, async () => {
    const uri = "mongodb://username:password@mongo:27017";
    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db("test");
    const collection = database.collection<{ test: number }>("tests");

    server.post("/todos", async (req, res) => {
        const result = await collection.insertOne({
            test: Math.floor(Math.random() * 1000000)
        });
        res.json(result);
    });

    server.get("/todos", async (req, res) => {
        const results = await collection.find();
        res.json(await results.toArray());
    });
});
