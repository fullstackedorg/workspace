import Server from "Server"

const server = new Server();

server.express.get("/api/test", (req, res) => {
    res.send("test");
});

server.start();
