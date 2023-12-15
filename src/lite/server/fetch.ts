
import http from "http"
import https from "https"

// node native fetch isn't supported
// in nodejs-mobile
// https://github.com/nodejs-mobile/nodejs-mobile/issues/71
// @ts-ignore
global.fetch = global.fetch || function(input: string, init?: RequestInit) {
    console.log("======= FAKE FETCH =======")
    const client = input.startsWith("http:")
        ? http
        : https;

    let headers;
    if(init?.headers){
        console.log(init.headers);
        headers = {};
        Object.entries(init.headers).forEach(([key, value]) => {
            if(value)
                headers[key] = value
        });
    }

    return new Promise(resolve => {
        const options = {
            method: init?.method || "GET",
            headers
        };

        const request = client.request(input, options, response => {
            const headers = {
                get: (headerName: string) => headers[headerName.toLocaleLowerCase()]
            };
            Object.entries(response.headers).forEach(([key, value]) => headers[key] = value.toString());
            
            const td = new TextDecoder();

            const bodyPromise = new Promise<Buffer>((bodyResolve) => {
                let chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', () => {
                    const body = Buffer.concat(chunks);
                    bodyResolve(body);
                });
            });

            resolve({
                status: response.statusCode,
                headers,
                arrayBuffer: function(){
                    return new Promise(res => bodyPromise.then(res));
                },
                json: function(){
                    return new Promise(res => {
                        bodyPromise.then(data => {
                            res(JSON.parse(td.decode(data)));
                        })
                    })
                    
                },
                text: function(){
                    return new Promise(res => {
                        bodyPromise.then(data => {
                            res(td.decode(data));
                        })
                    })
                }
            } as Response)
        })

        request.on('error', err => {
            console.log('Error: ', err.message);
        });
    
        if(init?.body)
            request.write(init?.body);

        request.end()
    })
};