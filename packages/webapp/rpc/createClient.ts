class Client<ApiDefinition> {
    private origin;
    private cache: {[key: string]: any};
    private recurseInProxy(method: "GET" | "POST" | "PUT" | "DELETE", useCache = false, pathComponents: string[] = []){
        return new Proxy(fetchCall.bind(this), {
            apply: (target, _, argArray) => {
                // activate cache
                if(useCache && !this.cache)
                    this.cache = {};

                // check if response is already in cache
                if(method === "GET" && this.cache) {
                    const pathComponentsAsStr = pathComponents.toString();
                    const argAsStr = argArray.map(arg => JSON.stringify(arg)).toString();

                    if(!this.cache[pathComponentsAsStr])
                        this.cache[pathComponentsAsStr] = {};

                    // update cache
                    if(!this.cache[pathComponentsAsStr][argAsStr] || !useCache)
                        this.cache[pathComponentsAsStr][argAsStr] = target(method, pathComponents, ...argArray);

                    return this.cache[pathComponentsAsStr][argAsStr];
                }

                return target(method, pathComponents, ...argArray);
            },
            get: (_, p) =>  {
                pathComponents.push(p as string);
                return this.recurseInProxy(method, useCache, pathComponents);
            }
        })
    }
    headers: {[key: string]: string} = {};
    requestOptions: RequestInit = {}

    constructor(origin) {
        this.origin = origin;
    }

    get(useCache = false){ return this.recurseInProxy("GET", useCache) as any as ApiDefinition }
    post(){ return this.recurseInProxy("POST", false) as any as ApiDefinition }
    put(){ return this.recurseInProxy("PUT", false) as any as ApiDefinition }
    delete(){ return this.recurseInProxy("DELETE", false) as any as ApiDefinition }
}

async function fetchCall(method, pathComponents, ...args) {
    const url = new URL(this.origin || (window.location.origin + "/rpc"));

    url.pathname += (url.pathname.endsWith("/") ? "" : "/") + pathComponents.join('/');

    const requestInit: RequestInit = {
        ...this.requestOptions,
        method
    };

    const headers = new Headers();

    switch (requestInit.method) {
        case 'POST':
        case 'PUT': {
            const body = {};
            args.forEach((value, index) => body[index] = value);
            headers.append('Content-Type', "application/json");
            requestInit.body = JSON.stringify(body);
            break;
        }
        default: {
            args.forEach((value, index) => {
                const isObject = typeof value === "object";

                if (!isObject) {
                    url.searchParams.append(index.toString(), value);
                    return;
                }

                headers.append('Content-Type', "application/json");
                url.searchParams.append(index.toString(), JSON.stringify(value));
            });
        }
    }

    Object.keys(this.headers).forEach(headerName => {
        headers.append(headerName, this.headers[headerName]);
    });
    requestInit.headers = headers;

    const response = await fetch(url.toString(), requestInit);

    const data = response.headers.get('Content-Type') === "application/json"
        ? await response.json()
        : await response.text();

    if(response.status >= 400)
        throw new Error(data);

    return data;
}

type OnlyOnePromise<T> = T extends PromiseLike<any>
    ? T
    : Promise<T>;

type AwaitAll<T> = {
    [K in keyof T]:  T[K] extends ((...args: any) => any)
        ? (...args: T[K] extends ((...args: infer P) => any) ? P : never[]) =>
            OnlyOnePromise<(T[K] extends ((...args: any) => any) ? ReturnType<T[K]> : any)>
        : AwaitAll<T[K]>
}

export default function createClient<ApiDefinition>(origin = "") {
    return new Client<ApiDefinition>(origin) as {
        requestOptions: Client<ApiDefinition>['requestOptions'],
        headers: Client<ApiDefinition>['headers'],
        get(useCache?: boolean): AwaitAll<ApiDefinition>,
        post(): AwaitAll<ApiDefinition>,
        put(): AwaitAll<ApiDefinition>,
        delete(): AwaitAll<ApiDefinition>,
    };
}
