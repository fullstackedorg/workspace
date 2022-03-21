import express from "express";
import path from "path";

export default class Server {
    express = express();

    start(){
        this.express.use(express.static(path.resolve(__dirname, './public')));

        const port = 8000;
        this.express.listen(port);

        console.log("Listening at http://localhost:" + port);
    }
}
