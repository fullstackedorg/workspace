import {clearLine, cursorTo} from "readline";
import Info from "fullstacked/info";

export default abstract class {
    write: (str) => void = process.stdout.write.bind(process.stdout);
    printLine = (str: string) => {
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0, null);
        process.stdout.write(str);
    };
    endLine: () => void = () => process.stdout.write("\n\r");

    constructor() { Info.init() }

    abstract run(): void;
    abstract runCLI(): void;
}
