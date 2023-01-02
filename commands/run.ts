import Runner from "../utils/runner";
import os from "os";
import readline from "readline";
import {FullStackedConfig} from "../index";
import CommandInterface from "./Interface";
import {CMD} from "../types/gui";
import {Writable} from "stream";
import Build from "./build";

export default class Run extends CommandInterface {
    runner: Runner;

    guiCommands(): { cmd: CMD; callback(data, tick?: () => void): any }[] {
        return [];
    }

    async restart(){
        if(!this.runner){
            this.runner = new Runner(this.config);
            await this.runner.start();
        }else{
            await this.runner.restart();
        }
    }

    async run(): Promise<void> {
        await Build(this.config);

        await this.restart();
        console.log("Web App Running at http://localhost:" + this.runner.nodePort);

        const stream = new Writable({
            write: (chunk, encoding, next) => {
                this.printLine(chunk.toString());
                next();
            }
        });

        await this.runner.attach(stream);
    }

    runCLI(): Promise<void> {
        return this.run();
    }

}
