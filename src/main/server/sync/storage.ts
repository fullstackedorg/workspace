import { SyncClient } from "./client";
import type { SyncService } from "./service";
import { StorageResponse, StorageSerialized, StorageErrorType } from "./types";
import http2 from "http2"

export default class Storage {
    static addStorage: typeof SyncService.addStorage;
    static helloCacheInterval = 2000;

    origin: string;
    name: string;
    client: SyncClient;

    keys?: string[];

    isCluster: boolean;
    cluster: string;

    private lastHello = 0;
    
    constructor(serializedStorage: StorageSerialized) {
        this.origin = serializedStorage.origin;
        this.name = serializedStorage.name;

        if(serializedStorage.keys)
            this.keys = serializedStorage.keys;

        if(serializedStorage.client?.authorization) {
            this.client = new SyncClient(this.origin);
            this.client.authorization = serializedStorage.client.authorization
        }
    }

    async hello(useCache: boolean = true): Promise<StorageResponse>{
        if(!this.client)
            this.client = new SyncClient(this.origin);

        const now = Date.now();
        useCache = useCache && now - this.lastHello < Storage.helloCacheInterval;

        let response: StorageResponse;
        try {
            // hello responds 200 with empty body if OK
            response = await this.client.fs.get(useCache).hello();
        } catch (e) {
            if(this.origin.startsWith("http:"))
                this.client.useHttp2Client = true;

            return handleHelloError(this.client.fs.origin, e);
        }

        if(!useCache)
            this.lastHello = now;

        if(response?.error === StorageErrorType.CLUSTER){
            this.isCluster = true;

            response.endpoints.forEach(endpoint => {
                let serializedStorage: StorageSerialized = typeof endpoint === "string"
                    ? {origin: endpoint}
                    : {origin: endpoint.url, name: endpoint.name}

                const authorization = this.client.authorization;  
                if(authorization){
                    serializedStorage.client = {
                        authorization
                    }
                }  
                
                Storage.addStorage(serializedStorage, this.origin);
            });
        }

        if(response?.name) {
            this.name = response?.name
        }

        return response;
    }

    addKey(itemKey: string) {
        if(!this.keys)
            this.keys = [];
        
        if(!this.keys.includes(itemKey))
            this.keys.push(itemKey);
    }

    removeKey(itemKey: string){
        if(!this.keys)
            return;
        
        const indexOf = this.keys.indexOf(itemKey);
        if(indexOf < 0)
            return;

        this.keys.splice(indexOf, 1);
    }

    async listApps(){
        if(await this.hello()) 
            return [];

        const session = http2.connect(this.origin);
        session.on('error', (err) => {
            throw err;
        });
    
        const stream = session.request({
            ':path': '/packages',
            ':method': 'GET',
            ...this.client.rsync.headers
        });
        stream.end();
    
        stream.setEncoding('utf8');
        return new Promise<[string, number][]>(resolve => {
            let data = '';
            stream.on('data', (chunk) => { data += chunk })
            stream.on('end', () => {
                resolve(JSON.parse(data));
            });
        });
    }

    toJSON(){
        const { 
            origin,
            name,
            client,
            keys,
            isCluster,
            cluster
         } = this;

        return {
            origin,
            name,
            client,
            keys,
            isCluster,
            cluster
        }
    }
}

const defaultErrorResponse = (origin: string, errMessage: string): StorageResponse => {
    return {
        error: StorageErrorType.UNREACHEABLE,
        message: `endpoint [${origin}] response [${errMessage}]`
    }
}

function handleHelloError(origin: string, err: Error): StorageResponse {
    let json: StorageResponse;
    try {
        json = JSON.parse(err.message)
    } catch (e) {
        return defaultErrorResponse(origin, err.message);
    }

    switch(json.error) {
        case StorageErrorType.AUTHORIZATION:
        case StorageErrorType.CLUSTER:
        case StorageErrorType.UNREACHEABLE:
            return json;
        default:
            return defaultErrorResponse(origin, err.message);
    }
}