import { RsyncHTTP2Client } from "@fullstacked/sync/http2/client";
import createClient from "@fullstacked/webapp/rpc/createClient";
import fs from "fs";
import http2 from "http2";
import { StorageResponse } from "./types";

export class SyncClient {
    fs: ReturnType<typeof createClient<typeof fs.promises & { hello(): Promise<StorageResponse> }>>;
    rsync: RsyncHTTP2Client;

    useHttp2Client = true;

    constructor(endpoint: string) {
        this.rsync = new RsyncHTTP2Client(endpoint);

        this.fs = createClient(endpoint);

        // fetch API won't work with a not secured storage server (http)
        // so here we will override the fetch method of our client
        if (endpoint.startsWith("http:")) {
            this.fs.fetch = (urlStr: string, options?: RequestInit) => {
                if(!this.useHttp2Client) {
                    return fetch(urlStr, options);
                }
                
                const url = new URL(urlStr, this.fs.origin);

                return new Promise<Response>((resolve, reject) => {
                    const client = http2.connect(url.origin);
                    client.on("error", () => reject("Overriden fetch failed at connect."))

                    const outHeaders: http2.OutgoingHttpHeaders = {
                        ":path": url.pathname,
                        ":method": options.method || "GET"
                    }

                    Object.entries(options.headers).forEach(([name, value]) => {
                        outHeaders[name] = value;
                    })

                    const request = client.request(outHeaders);
                    request.on("error", () => {
                        this.useHttp2Client = false;
                        resolve(this.fs.fetch(urlStr, options));
                    });

                    const responsePromise = new Promise<Buffer>((responseResolve) => {
                        let chunks = [];
                        request.on('data', chunk => chunks.push(chunk));
                        request.on('end', () => {
                            const body = Buffer.concat(chunks);
                            responseResolve(body);
                        });
                    });

                    request.on("response", (responseHeaders) => {
                        const headers = {
                            get: (headerName: string) => responseHeaders[headerName.toLocaleLowerCase()]
                        } as Headers;

                        resolve({
                            status: responseHeaders[":status"],
                            headers,
                            arrayBuffer: function () {
                                return new Promise(res => responsePromise.then(res));
                            },
                            json: function () {
                                return new Promise(res => {
                                    responsePromise.then(data => {
                                        const td = new TextDecoder();
                                        res(JSON.parse(td.decode(data)));
                                    })
                                })

                            },
                            text: function () {
                                return new Promise(res => {
                                    responsePromise.then(data => {
                                        const td = new TextDecoder();
                                        res(td.decode(data));
                                    })
                                })
                            }
                        } as Response);
                    });

                    if (options?.body)
                        request.write(options.body);

                    request.end();
                })
            }
        }
    }

    get authorization(){
        return this.fs.headers.authorization;
    }
    set authorization(token: string) {
        this.fs.headers.authorization = token;
        this.rsync.headers.authorization = token;
    }
    set cookies(cookie: string) {
        this.fs.headers.cookie = cookie;
        this.rsync.headers.cookie = cookie;
    }

    toJSON() {
        const { authorization } = this.fs.headers;
        if (authorization)
            return { authorization }

        return undefined;
    }
}