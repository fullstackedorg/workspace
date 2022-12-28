# Server

Your FullStacked server will always run the default static file serving listener. After that, you can add more listeners to handle requests. 

## Example

Here's an example of a FullStacked Server using express and a custom listener.

```ts
// server/index.ts
import Server from "fullstacked/server"
import express from "express"

////// express ////// 

const app = express();

app.get("/api/bar", (req, res) => {
    res.send("bar");
});
app.get("/api/baz", (req, res) => {
    res.send("baz");
});

const { promisifiedListener, resolver } = Server.promisify(app);

// express bottoms out here
app.use(resolver);

Server.addListener(promisifiedListener);



//////  custom listener ////// 

Server.addListener((req, res) => {
    console.log("Custom listener does nothing");
    return;
});
```

![FullStacked Server](https://files.cplepage.com/fullstacked/server.png)

Here's how this server acts on runtime when receiving an incoming request :

0. The server receives a request with the path `/path/foo`

1. No files from the public directory is named `/path/foo`

2. Express does not register anything at `/path/foo`

3. The custom listener isn't doing anything

4. The server responds with `404 Not Found`

## Splitting into files

This same example would be much cleaner with each listener split into individual files:

```ts
// server/express.server.ts
import Server from "fullstacked/server"
import express from "express"

// express
const app = express();

app.get("/api/bar", (req, res) => {
    res.send("bar");
});
app.get("/api/baz", (req, res) => {
    res.send("baz");
});

const { promisifiedListener, resolver } = Server.promisify(app);

// express bottoms out here
app.use(resolver);

Server.addListener(promisifiedListener);
```

```ts
// server/custom.server.ts
import Server from "fullstacked/server"

// custom listener
Server.addListener((req, res) => {
    console.log("Custom listener does nothing");
    return;
});
```

## Promisifying

Most backend frameworks are designed to work by themselves, so when they bottom out, they have a built-in way to respond, but we might have another listener to come in play. The `Server.promisify` method helps with changing their behaviour. 

To get more familiar with it, checkout the method [source code](https://github.com/cplepage/fullstacked/blob/main/server.ts#L70) and templates using it :

- [express](https://github.com/cplepage/create-fullstacked/blob/main/templates/express/server/express.server.ts)

- [NestJS](https://github.com/cplepage/create-fullstacked/blob/main/templates/nestjs/server/nestjs.server.ts)
