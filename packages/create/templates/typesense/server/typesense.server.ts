import Server from "@fullstacked/webapp/server"
import httpProxy from "http-proxy";
import Typesense from "typesense";
import {testCollection, typesenseUrlPrefix} from "./typesense.values";

const {web} = httpProxy.createServer();

Server.addListener(typesenseUrlPrefix, {
    title: "Typesense",
    handler(req, res){
        web(req, res, {target: "http://typesense:8108"})
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


