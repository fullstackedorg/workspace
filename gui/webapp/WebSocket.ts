import {fetch} from "../../utils/fetch";
import {CMD, MESSAGE_FROM_BACKEND, MESSAGE_TYPE} from "../../types/gui";

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
    static tickSubscribers = new Map<string, () => void>();

    static init(){
        return new Promise<void>(async resolve => {
            const backendPort = await fetch.get("/port");

            if(!backendPort) resolve();

            this.ws = new WebSocket(`ws://localhost:${backendPort}`);
            this.ws.onmessage = (event) => {
                const {data, type, id}: MESSAGE_FROM_BACKEND = JSON.parse(event.data);

                switch (type) {
                    case MESSAGE_TYPE.RESPONSE:
                        const resolver = this.activeRequest.get(id);
                        resolver(data)
                        this.activeRequest.delete(id);
                        this.tickSubscribers.delete(id);
                        break;
                    case MESSAGE_TYPE.LINE:
                        let lastDiv = Array.from(this.logs.querySelectorAll("div")).at(-1);
                        if(!lastDiv || !lastDiv.classList.contains("line")) {
                            lastDiv = document.createElement("div");
                            lastDiv.classList.add("line");
                            this.logs.append(lastDiv);
                        }
                        lastDiv.innerText = data;
                        break;
                    case MESSAGE_TYPE.LOG:
                        this.logs.innerHTML += `<div>${data}</div>`;
                        break;
                    case MESSAGE_TYPE.ERROR:
                        this.logs.innerHTML += `<div class="text-danger">${data}</div>`;
                        Array.from(this.activeRequest.values()).forEach((resolver) => resolver());
                        break;
                    case MESSAGE_TYPE.TICK:
                        const tickSubscription = this.tickSubscribers.get(id);
                        if(tickSubscription) tickSubscription();
                        break;
                }

                this.logs?.scrollTo(0, this.logs.scrollHeight);
            };

            this.ws.onopen = resolve;
        });
    }

    static cmd(cmd: CMD, data?: any, tickSubscription?: () => void){
        if(this.ws.readyState !== 1) return;

        return new Promise<any>(resolve => {
            const id = randStr(10);
            this.activeRequest.set(id, resolve);

            if(tickSubscription)
                this.tickSubscribers.set(id, tickSubscription)

            this.ws.send(JSON.stringify({cmd, id, data}));
        })
    }
}
