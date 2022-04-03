import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import http from "http";

export const publicDir = path.resolve(__dirname, './public');

export default class Server {
    httpServer: http.Server;
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

    start(silent: boolean = false){
        if(process.argv.includes("--development")) {
            this.initDevTools();
        }

        this.express.use(express.static(publicDir));

        const port = 8000;
        this.httpServer = this.express.listen(port);

        if(!silent)
            console.log("Listening at http://localhost:" + port);
    }

    stop(){
        this.httpServer.close();
    }
}
