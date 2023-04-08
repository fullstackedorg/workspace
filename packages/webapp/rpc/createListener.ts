import type { IncomingMessage, ServerResponse } from 'http';
import * as fastQueryString from "fast-querystring";
import type {Listener} from "fullstacked/packages/webapp/server/index";

function checkMethod(method: string){
    if(this.method !== method)
        throw Error(`Wrong Method. Allowed [${method}] Used [${this.method}]`);
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

export function Middleware(wrappingFunction: (this: IncomingMessage, ...args: any[]) => any): any {
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
        let jsonString = '';

        req.on('data', function (data) {
            jsonString += data;
        });

        req.on('end', function () {
            resolve(JSON.parse(jsonString));
        });
    });
}

function callAPIMethod(req, res: ServerResponse, method, ...args): true | Promise<true>{
    let response, status = 200;
    try{
        response = method.bind(req)(...args);
    }catch (e){
        status = 500;
        response = {error: e.message};
    }

    const makeSureItsStringOrBuffer = (obj: any) => {
        if(!obj || obj instanceof Buffer) return obj;

        if (typeof obj !== "string") {
            obj = JSON.stringify(obj);
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
        return new Promise(resolve => {
            response
                .then(awaitedResponse => send(awaitedResponse))
                .catch(error => {
                    status = 500;
                    send(error.message);
                })
                .finally(() => resolve(true));
        });
    }

    send(response);
    return true;
}

export default function(api, basePath = "/rpc", name?: string): Listener {
    const listenerName = name ||
        basePath.split("/").filter(Boolean).join("-");

    return {
        name,
        handler(req, res): any {
            const urlComponents = req.url.split("?");

            const url = urlComponents.shift();
            const methodPath = url.split('/');
            methodPath.shift();

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
}
