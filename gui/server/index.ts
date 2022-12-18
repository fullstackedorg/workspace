import Server from "../../server";

Server.addListener((req, res) => {
    if(req.url !== "/port") return;

    res.writeHead(200);
    const backendPort = process.argv?.find(arg => arg.startsWith("--port="))?.slice("--port=".length);
    if(backendPort)
        res.write(backendPort);
    res.end();
});
