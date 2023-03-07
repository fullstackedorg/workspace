import {clearLine, cursorTo} from "readline";

export default abstract class {
    write: (str) => void = process.stdout.write.bind(process.stdout);
    printLine = (str: string) => {
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0, null);
        process.stdout.write(str);
    };
    endLine: () => void = () => process.stdout.write("\n\r");

    abstract run(): void;
    abstract runCLI(): void;
}
