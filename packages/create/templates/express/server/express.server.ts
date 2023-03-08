import Server from "@fullstacked/webapp/server"
import express from "express"

const app = express();

app.get("/hello-world", (req, res) => {
    res.send("Hello World");
});

Server.addListener("/express", {
    name: "express",
    handler: app
});
