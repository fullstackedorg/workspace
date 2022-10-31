import Server from "fullstacked/server";

const server = new Server();

server.addListener((req, res) => {
    if(req.url === "/hello-world"){
        res.writeHead(200, {"content-type": "text/plain"});
        res.write("Hello World");
        res.end();
    }
});

server.start();

export default server;
