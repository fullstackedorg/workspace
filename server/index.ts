import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import http from "http";
import https from "https";
import {registerBadgesRoutes} from "./Badges/badges";

export const publicDir = path.resolve(__dirname, './public');
export const assetsDir = publicDir + "/assets";

export default class Server {
    serverHTTP: http.Server;
    serverHTTPS: https.Server;
    express = express();

    constructor() {
        this.express.use("*/assets/:assetFile", (req, res, next) => {
            const filePath = assetsDir + "/" + req.params.assetFile;
            if(fs.existsSync(filePath))
                return res.sendFile(filePath);

            next();
        });
    }

    start(args: {silent: boolean, testing: boolean} = {silent: false, testing: false}){
        // source: https://stackoverflow.com/a/6398335
        if (require.main !== module && !args.testing) return;

        if(process.argv.includes("--development")) this.express.use(morgan('dev'));

        this.express.use("/badges", registerBadgesRoutes());

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
