import {FullStackedConfig} from "./index";
import {printLine} from "./scripts/utils";
import {CMD} from "./types/gui";

export abstract class CommandInterface {
    config: FullStackedConfig;
    write: (str) => void = process.stdout.write;
    printLine: (str) => void = printLine;
    endLine: () => void = () => process.stdout.write("\n\r")

    protected constructor(config: FullStackedConfig) {
        this.config = config;
    }

    abstract run(): void;
    abstract runCLI(): void;
    abstract guiCommands(): {
        cmd: CMD,
        callback(data, tick?: () => void): any
    }[]
}
