import {fetch} from "fullstacked/webapp/fetch";
import {DEPLOY_CMD} from "../../types/deploy";
import {MESSAGE_FROM_BACKEND, MESSAGE_TYPE} from "../../types/gui";

// source : https://stackoverflow.com/a/1349426
export function randStr(length) {
    let result           = '';
    const characters       = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export class WS {
    static ws;
    static logs: HTMLPreElement;
    static activeRequest = new Map<string, (data?: any) => void>();

    static init(){
        return new Promise(async resolve => {
            const backendPort = await fetch.get("/port");
            this.ws = new WebSocket(`ws://localhost:${backendPort}`);
            this.ws.onmessage = (event) => {
                const {data, type, id}: MESSAGE_FROM_BACKEND = JSON.parse(event.data);

                switch (type) {
                    case MESSAGE_TYPE.RESPONSE:
                        const resolver = this.activeRequest.get(id);
                        resolver(data)
                        this.activeRequest.delete(id);
                        break;
                    case MESSAGE_TYPE.LOG:
                        this.logs.innerHTML += `<div>${data}</div>`;
                        break;
                    case MESSAGE_TYPE.ERROR:
                        this.logs.innerHTML += `<div class="text-danger">${data}</div>`;
                        Array.from(this.activeRequest.values()).forEach((resolver) => resolver());
                        break
                }

                this.logs?.scrollTo(0, this.logs.scrollHeight);
            };

            this.ws.onopen = resolve;
        });
    }

    static cmd(cmd: DEPLOY_CMD, data?: any){
        return new Promise<any>(resolve => {
            const id = randStr(10);
            this.activeRequest.set(id, resolve);
            this.ws.send(JSON.stringify({cmd, id, data}));
        })
    }
}
