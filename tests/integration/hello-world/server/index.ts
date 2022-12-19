import Server from "../../../../server.js";

Server.addListener((req, res) => {
    if(req.url === "/hello-world"){
        res.writeHead(200, {"content-type": "text/plain"});
        res.write("Hello World");
        res.end();
    }
});

