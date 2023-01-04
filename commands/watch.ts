import Build from "./build";
import Run from "./run";
import {WebSocket} from "ws";
import sleep from "../utils/sleep";
import {FullStackedConfig} from "../index";


export default class Watch extends Run {
    timeout: number = 2000;
    ws: WebSocket;
    msgQueue: string[] = [];

    constructor(config: FullStackedConfig) {
        super(config);
        this.timeout = config.timeout ?? this.timeout;
    }

    connectToWatcher(port: number){
        this.ws = new WebSocket(`ws://localhost:${port}/watcher`);
        this.ws.addListener("open", () => {
            if(!this.msgQueue.length) return;
            this.msgQueue.forEach(msg => this.ws.send(msg));
            this.msgQueue = [];
        });
        this.ws.addListener('error', async () => {
            this.ws = null;
            await sleep(this.timeout);
            this.connectToWatcher(port);
        });
    }

    async watcher(isWebApp: boolean, first = false){
        if(isWebApp) {
            console.log('\x1b[32m%s\x1b[0m', "WebApp Rebuilt");
            const msg = Date.now().toString();

            if(this.ws) this.ws.send(msg);
            else this.msgQueue.push(msg);

            return;
        }

        if(!first)
            console.log('\x1b[32m%s\x1b[0m', "Server Rebuilt");
        else
            console.log('\x1b[33m%s\x1b[0m', "Watching...")

        await this.restart();

        this.connectToWatcher(this.runner.nodePort);
    }

    async run(): Promise<void> {
        // build with the watcher defined
        await Build(this.config, this.watcher.bind(this));
        await this.watcher(false, true);
        console.log("Web App Running at http://localhost:" + this.runner.nodePort);
    }

    runCLI(): Promise<void> {
        return this.run();
    }
}
