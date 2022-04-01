import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";

export const publicDir = path.resolve(__dirname, './public');

export default class Server {
    express = express();

    private initDevTools(){
        this.express.use(morgan('dev', {
            skip: function (req, res) { return req.path === "/dev" }
        }));

        this.express.get("/dev", (req, res) => {
            const stats = fs.statSync(publicDir + "/index.js");
            res.json(stats.mtimeMs);
        });
    }

    start(){
        if(process.argv.includes("--development")) {
            this.initDevTools();
        }

        this.express.use(express.static(publicDir));

        const port = 8000;
        this.express.listen(port);

        console.log("Listening at http://localhost:" + port);
    }
}
