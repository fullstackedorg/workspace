import Server from "../../server";

Server.addListener((req, res) => {
    if(req.url !== "/port") return;

    res.writeHead(200);
    res.write(process.argv.find(arg => arg.startsWith("--port=")).slice("--port=".length));
    res.end();
});
