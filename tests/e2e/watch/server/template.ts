import Server from "../../../../server.js";

const bootTime = Date.now();
Server.listeners.push({
    handler(req, res) {
        if (req.url !== "/bootTime") return;

        res.writeHead(200, {"content-type": "text/plain"});
        res.write(bootTime.toString());
        res.end();
    }
});

