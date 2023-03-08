import {describe, it} from "mocha";
import {equal, ok} from "assert";
import testIntegration from "fullstacked/utils/testIntegration";

import Mongo from "../server/mongodb";

testIntegration(describe("MongoDB Template Tests", function(){
    new Mongo();
    const dbName = "db";
    const collectionName = "documents";

    it('Should create read delete', async function(){
        await Mongo.connect();
        const db = Mongo.client.db(dbName);
        const collection = db.collection<{ test: string }>(collectionName);
        const value = "value";
        const result = await collection.insertOne({test: value});
        equal((await collection.findOne({_id: result.insertedId})).test, value);
        await collection.deleteOne({_id: result.insertedId});
        equal((await (await collection.find()).toArray()).length, 0);
        await Mongo.close();
    });
}));
