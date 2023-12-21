import createListener from "@fullstacked/webapp/rpc/createListener";
import Server from "@fullstacked/webapp/server";
import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { WebSocket, WebSocketServer } from "ws";

type MultiLevelAPI = {
    [methodName: string]: MultiLevelAPI | Function
}

export type WebSocketRegisterer = {
    path: string,
    handleUpgrade?: (req: IncomingMessage, socket: Duplex, head: Buffer) => Promise<boolean> | boolean,
    onConnection?: (ws: WebSocket, req: IncomingMessage) => void
};

export abstract class BackendTool {
    abstract api: MultiLevelAPI;
    abstract listeners: Parameters<Server["addListener"]>[0][];
    abstract websocket: WebSocketRegisterer;
}

type MergeTypes<T extends unknown[]> = 
    T extends [a: { api: infer A }, ...rest: infer R] ? A & MergeTypes<R> : {};

export default class Backend {
    static server = new Server();

    static register<T extends BackendTool[]>(...backendTools: T) {
        let globalApi: Partial<MergeTypes<T>> = {};

        for (const backendTool of backendTools) {
            if (!backendTool) continue;

            const { listeners, api, websocket } = backendTool;

            Backend.addWebsocket(websocket);

            listeners?.forEach(listener => Backend.server.addListener(listener));

            globalApi = {
                ...globalApi,
                ...api
            }
        }

        // create listener for API
        Backend.server.addListener(createListener(globalApi));

        // add listener for websockets
        Backend.server.serverHTTP.on("upgrade", Backend.onUpgrade)

        return globalApi as MergeTypes<T>;
    }

    private static websocketServer: WebSocketServer;
    private static websockets: WebSocketRegisterer[] = [];
    private static addWebsocket(registerer: WebSocketRegisterer) {
        if(!registerer)
            return;

        if(!Backend.websocketServer)
            Backend.websocketServer = new WebSocketServer({noServer: true});

        Backend.websockets.push(registerer);
        Backend.websockets = Backend.websockets.sort((a, b) => {
            return a.path.length < b.path.length
                ? -1
                : a.path.length > b.path.length
                    ? 1
                    : 0;
        })
    }
    private static async onUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer){
        for(const websocket of Backend.websockets){
            if(socket.closed) return;

            if(req.url.startsWith(websocket.path)){
                if (websocket.handleUpgrade) {
                    const didUpgrade = websocket.handleUpgrade(req, socket, head);

                    if(didUpgrade instanceof Promise)
                        await didUpgrade;

                    if(didUpgrade)
                        return;
                }
                else if(websocket.onConnection) {
                    Backend.websocketServer.handleUpgrade(req, socket, head, ws => websocket.onConnection(ws, req));
                    return;
                }
            }
        }
    }
}