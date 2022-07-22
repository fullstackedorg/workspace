import Server from "fullstacked/server";

const server = new Server();

server.express.get("/hello-world",
    (req, res) => res.send("Hello World"));

server.start();

export default server;
