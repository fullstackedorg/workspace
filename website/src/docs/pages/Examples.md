# Examples

The examples here assume that you've already went through the 
[Quick Start](https://fullstacked.org/docs/quick-start) guide.

### MongoDB 
A database is often very useful. Aka MERN stack, here's how you can add 
mongoDB to your stack. You will simply need to add the `mongo` image 
to your `docker-compose.yml` and create the connection on your server side.

1. Create a `docker-compose.yml` at the source root of your project. 
Your project directory should look something like this
```
|_ node_modules/
|_ docker-compose.yml
|_ index.tsx
|_ package.json
|_ package-lock.json
|_ server.ts
|_ test.ts
```
2. Add the `mongo` image to the newly created `docker-compose.yml`.
```yaml
version: '3.7'

services:
  mongo:
    image: mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: username
      MONGO_INITDB_ROOT_PASSWORD: password
```
3. Install the node [mongodb](https://www.npmjs.com/package/mongodb) package.
> You can always use [mongoose](https://www.npmjs.com/package/mongoose) if you prefer. It is another very popular choice.
```shell
npm i mongodb
```
4. Setup the connection on your server-side.
```ts
import {MongoClient} from "mongodb";

const uri = "mongodb://username:password@mongo:27017";
const client = new MongoClient(uri);
await client.connect();

// ...

await client.close();
```
5. Create some awesome applications! Here's a small CRUD for a todo app
```ts
// server.ts

import Server from "fullstacked/server";
import {json} from "express";
import {MongoClient, ObjectId} from "mongodb";

type Todo = {
    _id?: string | ObjectId,
    title: string,
    checked: boolean
}

const server = new Server();

(async () => {
    const uri = "mongodb://username:password@mongo:27017";
    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db("todo-snippet");
    const todosCollection = database.collection<Todo>("todos");

    // create
    server.express.post("/todos", json(), async (req, res) => {
        const todo: Todo = req.body;
        const result = await todosCollection.insertOne(todo);
        res.json(result);
    });

    // read
    server.express.get("/todos", async (req, res) => {
        const results = await todosCollection.find();
        res.json(results.toArray());
    });

    // update
    server.express.put("/todos/:id", json(), async (req, res) => {
        const todo: Todo = req.body;
        delete todo._id;
        const result = await todosCollection.findOneAndReplace({
            _id: new ObjectId(req.params.id)
        }, todo);
        res.json(result);
    });

    // delete
    server.express.delete("/todos/:id", async (req, res) => {
        const result = await todosCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        });
        res.json(result);
    });
    
})();

export default server;
```
