import Build from "./build";
import Run from "./run";
import {WebSocket} from "ws";
import sleep from "../utils/sleep";
import {FullStackedConfig} from "../index";
import Restore from "./restore";


export default class Watch extends Run {
    timeout: number = 0;
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
            await sleep(2000);
            this.connectToWatcher(port);
        });
    }

    async watcher(isWebApp: boolean, first = false){
        if(isWebApp) {
            if(this.timeout) await sleep(this.timeout);

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

        if(this.config.restored) {
            await Restore(this.config);
            await this.runner.attach(this.out);
        }

        if(!this.config.silent)
            console.log(`Web App Running at http://${this.runner.host}:${this.runner.nodePort}`);
    }

    runCLI(): Promise<void> {
        return this.run();
    }
}