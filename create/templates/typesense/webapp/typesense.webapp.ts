import Typesense from "typesense";
import {testCollection} from "../server/typesense.values";

const typesense = new Typesense.Client({
    nodes: [
        {
            host: window.location.hostname,
            path: "/search",
            port: window.location.port
                ? parseInt(window.location.port)
                : window.location.protocol === "https:"
                    ? 443
                    : 80,
            protocol: window.location.protocol.slice(0, -1)
        }
    ],
    apiKey: 'xyz',
    numRetries: 3,
    connectionTimeoutSeconds: 10,
    retryIntervalSeconds: 1,
    healthcheckIntervalSeconds: 2,
    logLevel: 'debug'
});

function typesenseSearch(searchStr: string){
    return typesense.collections<{ searchStr: string }>(testCollection).documents().search({
        q: searchStr,
        query_by: "searchStr"
    })
}

(async () => {
    const typesenseDIV = document.createElement("div");
    typesenseDIV.setAttribute("id", "typesense");
    document.body.append(typesenseDIV);
    typesenseDIV.innerText = (await typesenseSearch("Hel")).hits.at(0).document.searchStr;
})()
