import Server from "fullstacked/server";


const server = new Server();

const bootTime = Date.now();
server.server.addListener("request", (req, res) => {
    if(req.url === "/bootTime"){
        res.writeHead(200, {"content-type": "text/plain"});
        res.write(bootTime.toString());
        res.end();
    }
});

server.start();
