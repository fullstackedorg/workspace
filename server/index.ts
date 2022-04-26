import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import http from "http";
import https from "https";
import {registerBadgesRoutes} from "./Badges/badges";

export const publicDir = path.resolve(__dirname, './public');

export default class Server {
    serverHTTP: http.Server;
    serverHTTPS: https.Server;
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

    start(args: {silent: boolean, testing: boolean} = {silent: false, testing: false}){
        this.express.use("/badges", registerBadgesRoutes());

        // source: https://stackoverflow.com/a/6398335
        if (require.main !== module && !args.testing) return;

        if(process.argv.includes("--development")) {
            this.initDevTools();
        }

        this.express.use(express.static(publicDir));

        const portHTTP = 8000;
        const portHTTPS = 8443;

        this.serverHTTP = http.createServer(this.express).listen(portHTTP);
        if(!args.silent)
            console.log("Listening at http://localhost:" + portHTTP);


        if(fs.existsSync('./key.pem') && fs.existsSync('./cert.pem')) {
            const options = {
                key: fs.readFileSync('./key.pem'),
                cert: fs.readFileSync('./cert.pem')
            };

            this.serverHTTPS = https.createServer(options, this.express).listen(portHTTPS);

            if(!args.silent)
                console.log("Listening at https://localhost:" + portHTTPS);
        }
    }

    stop(){
        this.serverHTTP.close();

        if(this.serverHTTPS)
            this.serverHTTPS.close();
    }
}
