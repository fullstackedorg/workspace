import type { IncomingMessage, ServerResponse } from 'http';
import * as fastQueryString from "fast-querystring";
import type {Listener} from "../server/index";

function checkMethod(method: string){
    if(this.req.method !== method)
        throw Error(`Wrong Method. Allowed [${method}] Used [${this.req.method}]`);
}

function wrapFunction(originalFunction, wrappingFunction){
    return {
        middleware: async function(...args) {
            let middlewareReturnedValue = wrappingFunction.bind(this)(...args);

            if(middlewareReturnedValue instanceof Promise)
                middlewareReturnedValue = await middlewareReturnedValue;

            if(middlewareReturnedValue?.args)
                args = middlewareReturnedValue.args;

            Object.assign(this, middlewareReturnedValue);

            if (originalFunction.middleware) {
                originalFunction = originalFunction.middleware;
            }

            return originalFunction.bind(this)(...args);
        },
        originalFunction
    }
}

export function Get(): any{
    return Middleware(function (){
        checkMethod.bind(this)("GET");
    });
}
export function Post(): any{
    return Middleware(function (){
        checkMethod.bind(this)("POST");
    });
}
export function Put(): any{
    return Middleware(function (){
        checkMethod.bind(this)("PUT");
    });
}
export function Delete(): any{
    return Middleware(function (){
        checkMethod.bind(this)("DELETE");
    });
}

function maybeNumber(value){
    const floatValue = parseFloat(value);
    return floatValue.toString() === value ? floatValue : value;
}

export function Numbers(): any {
    return Middleware(function (...args){
        args = args.map(arg => {
            if(typeof arg === "object" && Array.isArray(arg)){
                return arg.map(maybeNumber);
            }

            return maybeNumber(arg)
        });
        return {args};
    })
}

export function Json(): any {
    return Middleware(function (...args){
        args = args.map(arg => {
            try{
                return JSON.parse(arg);
            }catch (e) {
                return arg;
            }
        });
        return {args};
    })
}

export function Middleware(wrappingFunction: (this: {req: IncomingMessage, res: ServerResponse}, ...args: any[]) => any): any {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if(!descriptor){
            const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(new target));
            keys.forEach(key => {
                target.prototype[key] = wrapFunction(target.prototype[key], wrappingFunction);
            })
            return target;
        }
        descriptor.value = wrapFunction(descriptor.value, wrappingFunction);
    };
}

function readBody(req: IncomingMessage) {
    return new Promise((resolve) => {
        let data = "";
        req.on('data', chunk => data += chunk.toString());
        req.on('end', () => resolve(JSON.parse(data || "{}")));
    });
}

// source: https://stackoverflow.com/a/69881039/9777391
function JSONCircularRemover(){
    const visited = new WeakSet();
    return (key, value) => {
        if(typeof value !== "object" || value === null)
            return value;

        if (visited.has(value)) {
            return "[Circular]";
        }

        visited.add(value);
        return value;
    };
}

function callAPIMethod(req, res: ServerResponse, method, ...args) {
    let response, status = 200;
    try{
        response = method.bind({req, res})(...args);
    }catch (e){
        status = 500;
        response = {error: e.message};
    }

    const makeSureItsStringOrBuffer = (obj: any) => {
        if(!obj || obj instanceof Buffer) return obj;

        if (typeof obj !== "string") {
            obj = JSON.stringify(obj, JSONCircularRemover());
            res.setHeader("Content-Type", "application/json");
        }

        return obj;
    }

    const send = (data) => {
        const payload = makeSureItsStringOrBuffer(data)
        res.writeHead(status);
        res.end(payload);
    }

    if(response instanceof Promise) {
        return new Promise<void>(resolve => {
            response
                .then(awaitedResponse => send(awaitedResponse))
                .catch(error => {
                    status = 500;
                    send(error.message);
                })
                .finally(() => resolve());
        });
    }

    send(response);
}

export function createHandler(api: any){
    return (req, res) => {
        const urlComponents = req.url.split("?");

        const url = urlComponents.shift();
        const methodPath = url.split('/');
        // remove empty element from forward slash
        // /path/to/method => [ "", "path", "to", "method" ]
        methodPath.shift();

        if(req.method === "GET" && methodPath.length === 1 && methodPath.at(0) === "types"){
            res.setHeader("application/json");
            res.end(JSON.stringify(api));
            return;
        }

        let method = methodPath.reduce((api, key) => api ? api[key] : undefined, api);

        if(!method) return false;

        if(typeof method === "object" && method[""])
            method = method[""];

        if (method.middleware) {
            method = method.middleware;
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            return new Promise<Boolean>(resolve => {
                readBody(req).then(body => {
                    const args = Object.values(body);
                    const apiCall = callAPIMethod(req, res, method, ...args);
                    if(apiCall instanceof Promise)
                        apiCall.then(() => resolve(true));
                    else
                        resolve(true);
                });
            })
        }

        const queryParams = fastQueryString.parse(urlComponents.join("?"));
        let args = Object.values(queryParams);

        if(req.headers['content-type'] === "application/json"){
            args = args.map(param => {
                try {
                    return JSON.parse(param)
                }catch (e){
                    return decodeURIComponent(param);
                }
            })
        }

        return callAPIMethod(req, res, method, ...args);
    }
}

export default function(api, basePath = "/rpc", name?: string): Listener & {prefix: string} {
    return {
        prefix: basePath,
        name: name || basePath.split("/").filter(Boolean).join("-"),
        handler: createHandler(api)
    }
}
