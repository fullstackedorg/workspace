import express from "express";
import path from "path";
import fs from "fs";

const publicDir = path.resolve(__dirname, './public');

export default class Server {
    express = express();

    registerDevEndpoint(){
        this.express.get("/dev", (req, res) => {
            const stats = fs.statSync(publicDir + "/index.js");
            res.json(stats.mtimeMs);
        });
    }

    start(){
        this.express.use(express.static(publicDir));

        this.registerDevEndpoint();

        const port = 8000;
        this.express.listen(port);

        console.log("Listening at http://localhost:" + port);
    }
}
