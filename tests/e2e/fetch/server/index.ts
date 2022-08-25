import Server from "fullstacked/server"

const server = new Server();

server.get<string>("/api/test", (req, res) => res.send("test"));
server.post<string, {}>("/api/test", (req, res) => res.send("test"));
server.put<string, {}>("/api/test", (req, res) => res.send("test"));
server.delete<string>("/api/test", (req, res) => res.send("test"));

server.start();
