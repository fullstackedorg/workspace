import httpProxy from "http-proxy";
import Server from "fullstacked/server";
import Typesense from "typesense";
import {testCollection, typesensePath} from "./typesense.values";

const proxy = httpProxy.createServer({ws: false});

Server.listeners.push({
    title: "Typesense proxy",
    handler(req, res){
        if (!req.url.startsWith(typesensePath)) return;
        req.url = req.url.slice(typesensePath.length);
        return new Promise<void>(resolve => {
            proxy.web(req, res, {target: "http://typesense:8108"}, resolve);
        });
    }
});

const client = new Typesense.Client({
    nodes: [{
        host: 'typesense',
        port: 8108,
        protocol: 'http'
    }],
    apiKey: 'xyz',
    connectionTimeoutSeconds: 10,
    retryIntervalSeconds: 2,
    numRetries: 10,
    logLevel: "error"
});

(async () => {
    console.log("===== Typesense Init =====");

    if((await client.collections().retrieve()).some(collection => collection.name === testCollection)){
        console.log("====== Deleting old test collection ======")
        await client.collections(testCollection).delete();
    }

    await client.collections().create({
        name: testCollection,
        fields: [
            {name: 'searchStr', type: 'string'}
        ]
    });

    await client.collections(testCollection).documents().import([{
        searchStr: "Hello from Typesense"
    }]);

    console.log("===== Typesense Ready =====");
})()


