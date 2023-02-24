import Server from "../../../../server";

Server.listeners.push({
    handler(req, res): void | Promise<void> {
        if(req.url !== "/hello-world") return;

        res.writeHead(200, {"content-type": "text/plain"});
        res.write("Hello World");
        res.end();
    }
});

