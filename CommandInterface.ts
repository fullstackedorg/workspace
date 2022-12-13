import {FullStackedConfig} from "./index";
import {printLine} from "./scripts/utils";
import {DEPLOY_CMD} from "./types/deploy";

type CMD = DEPLOY_CMD;

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
