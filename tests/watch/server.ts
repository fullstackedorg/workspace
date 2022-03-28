import Server from "fullstacked/server";

(() => {
    const bootTime = Date.now();

    const server = new Server();

    server.express.get("/bootTime", (req, res) => {
        res.json(bootTime);
    });

    server.start();
})()
