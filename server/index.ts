import express, {Router as expressRouter, Request, RequestHandler, Response, RequestParamHandler} from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import http from "http";
import {ParsedQs} from "qs";

// source : https://stackoverflow.com/a/54973882
type Override<T, U> = Omit<T, keyof U> & U;

export class Router{
    express = expressRouter();

    get<RES_BODY, QUERY_OBJ extends ParsedQs = {}>(
        path: string,
        handler: (req: Override<Request, {query: QUERY_OBJ}>, res: Response<RES_BODY>) => void,
        ...middlewares: RequestHandler[]
    ){
        this.express.get(path, ...middlewares, handler);
    }

    post<RES_BODY, REQ_BODY, QUERY_OBJ extends ParsedQs = {}>(
        path: string,
        handler: (req: Override<Request, {query: QUERY_OBJ, body: REQ_BODY}>, res: Response<RES_BODY>) => void,
        ...middlewares: RequestHandler[]
    ){
        this.express.post(path, ...middlewares, handler);
    }

    put<RES_BODY, REQ_BODY, QUERY_OBJ extends ParsedQs = {}>(
        path: string,
        handler: (req?: Override<Request, {query: QUERY_OBJ, body: REQ_BODY}>, res?: Response<RES_BODY>) => void,
        ...middlewares: RequestHandler[]
    ){
        this.express.put(path, ...middlewares, handler);
    }

    delete<RES_BODY, QUERY_OBJ extends ParsedQs = {}>(
        path: string,
        handler: (req: Override<Request, {query: QUERY_OBJ}>, res: Response<RES_BODY>) => void,
        ...middlewares: RequestHandler[]
    ){
        this.express.delete(path, ...middlewares, handler);
    }
}

export default class Server extends Router{
    server: http.Server;
    watcher;
    port: number = 80;
    express = express();
    publicDir = path.resolve(__dirname, './public');
    assetsDir = this.publicDir + "/assets";

    constructor() {
        super();
        if(process.argv.includes("--development")) this.express.use(morgan('dev'));

        this.express.use("*/assets/:assetFile", (req, res, next) => {
            const filePath = this.assetsDir + "/" + req.params.assetFile;
            if(fs.existsSync(filePath))
                return res.sendFile(filePath);

            next();
        });
    }

    start(args: {silent?: boolean, testing?: boolean} = {silent: false, testing: false}, callback?: Function){
        // prevent starting server by import
        // source: https://stackoverflow.com/a/6398335
        if (require.main !== module && !args.testing) return;

        this.express.use(express.static(this.publicDir));

        this.server = http.createServer(this.express).listen(this.port);

        if(process.argv.includes("--development")){
            const watcherModule = require("./watcher");
            this.watcher = new watcherModule.default();
            this.watcher.init(this.server);
        }

        if(callback) callback();
    }

    stop(){
        this.server.close();
    }
}
