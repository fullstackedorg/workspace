import Server from "fullstacked/server";
import path from "path";

const server = new Server();

server.get("/", (req, res) => {
    res.sendFile(path.resolve(server.publicDir, "home.html"));
})

server.start();

export default server;
