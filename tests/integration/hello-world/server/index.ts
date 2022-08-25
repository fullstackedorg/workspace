import Server from "fullstacked/server";

const server = new Server();

server.get<string>("/hello-world", (req, res) => res.send("Hello World"));
server.post<string, {hello: "world"}>("/hello-world", (req, res) => res.send("Hello World"));
server.put<string, {hello: "world"}>("/hello-world", (req, res) => res.send("Hello World"));
server.delete<string>("/hello-world", (req, res) => res.send("Hello World"));

server.start();

export default server;
