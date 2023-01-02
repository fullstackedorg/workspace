import Server from "../../server.js";

Server.listeners.push({
    title: "Port",
    handler(req, res): void | Promise<void> {
        if(req.url !== "/port") return;

        res.writeHead(200);

        const backendPort = process.argv?.find(arg => arg.startsWith("--port="))?.slice("--port=".length);
        if(backendPort)
            res.write(backendPort);

        res.end();
    }
});
