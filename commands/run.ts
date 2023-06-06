import Runner from "../utils/runner";
import {FullStackedConfig} from "../index";
import CommandInterface from "./Interface";
import {Writable} from "stream";
import Build from "./build";
import Restore from "./restore";
import {RUN_CMD} from "../types/run";

export default class Run extends CommandInterface {
    runner: Runner;
    out: Writable;
    started: boolean = false;

    constructor(config: FullStackedConfig) {
        super(config);

        this.out = new Writable({
            write: (chunk, encoding, next) => {
                this.write(chunk.toString());
                next();
            }
        });

        this.runner = new Runner(this.config);
    }

    guiCommands(): { cmd: RUN_CMD; callback(data, tick?: () => void): any }[] {
        return [
            {
                cmd: RUN_CMD.START,
                callback: () => this.run()
            },{
                cmd: RUN_CMD.BENCH,
                async callback({url}) {
                    const start = Date.now();
                    await fetch(url);
                    return Date.now() - start;
                }
            }
        ];
    }

    async restart(){
        if(!this.started){
            await this.runner.start();
            this.started = true;
        }else{
            await this.runner.restart();
        }

        if(!this.config.silent)
            await this.runner.attach(this.out);
    }

    async run(): Promise<void> {
        await Build(this.config);
        await this.restart();

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