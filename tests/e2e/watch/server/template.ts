import Server from "../../../../server";

const bootTime = Date.now();
Server.addListener((req, res) => {
    if(req.url === "/bootTime"){
        res.writeHead(200, {"content-type": "text/plain"});
        res.write(bootTime.toString());
        res.end();
    }
});
