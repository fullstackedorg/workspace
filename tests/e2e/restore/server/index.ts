import Server from "../../../../server.js";
import {MongoClient} from 'mongodb';

(async () => {
    const uri = "mongodb://username:password@mongo:27017";
    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db("test");
    const collection = database.collection<{ test: number }>("tests");

    Server.listeners.push({
        async handler(req, res){
            if(req.url !== "/post" || req.method !== "POST") return;

            const result = await collection.insertOne({
                test: Math.floor(Math.random() * 1000000)
            });

            res.writeHead(200, {"content-type": "application/json"});
            res.write(JSON.stringify(result));
            res.end();
        }
    });

    Server.listeners.push({
        async handler(req, res){
            if(req.url !== "/get") return;

            const result = await collection.find();
            const data = await result.toArray();

            res.writeHead(200, {"content-type": "application/json"});
            res.write(JSON.stringify(data));
            res.end();
        }
    });
})()
