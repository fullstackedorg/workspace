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
        if(process.argv.includes("--development")) this.express.use(morgan('dev'));

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

        this.express.use("/badges", registerBadgesRoutes());

        this.express.use(express.static(publicDir));

        const portHTTP = 8000;
        const portHTTPS = 8443;

        this.serverHTTP = http.createServer(this.express).listen(portHTTP);
        if(!args.silent)
            console.log("Listening at http://localhost:" + portHTTP);


        const keysLocationBasePath = [".", "/keys"];
        for (let i = 0; i < keysLocationBasePath.length; i++) {
            const basePath = keysLocationBasePath[i];
            if(!fs.existsSync(basePath + '/key.pem') || !fs.existsSync(basePath + '/cert.pem'))
                continue;

            const options = {
                key: fs.readFileSync(basePath + '/key.pem'),
                cert: fs.readFileSync(basePath + '/cert.pem')
            };

            this.serverHTTPS = https.createServer(options, this.express).listen(portHTTPS);

            if(!args.silent)
                console.log("Listening at https://localhost:" + portHTTPS);

            break;
        }
    }

    stop(){
        this.serverHTTP.close();

        if(this.serverHTTPS)
            this.serverHTTPS.close();
    }
}
