import Server from "fullstacked/server";
import type {Application} from "express";

export default function(app: Application){
    const { handler, resolver } = Server.promisify(app);

    app.use(resolver);

    Server.listeners.push({
        title: "express",
        handler
    });
}
