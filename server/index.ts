import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import http from "http";

export default class Server {
    server: http.Server;
    express = express();
    publicDir = path.resolve(__dirname, './public');
    assetsDir = this.publicDir + "/assets";

    constructor() {
        if(process.argv.includes("--development")) this.express.use(morgan('dev'));

        this.express.use("*/assets/:assetFile", (req, res, next) => {
            const filePath = this.assetsDir + "/" + req.params.assetFile;
            if(fs.existsSync(filePath))
                return res.sendFile(filePath);

            next();
        });
    }

    start(args: {silent: boolean, testing: boolean} = {silent: false, testing: false}){
        // prevent starting server by import
        // source: https://stackoverflow.com/a/6398335
        if (require.main !== module && !args.testing) return;

        this.express.use(express.static(this.publicDir));

        const port = 80;

        this.server = http.createServer(this.express).listen(port);
        if(!args.silent)
            console.log("Listening at http://localhost:" + port);
    }

    stop(){
        this.server.close();
    }
}
