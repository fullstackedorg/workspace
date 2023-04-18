import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import {fork} from "child_process";
import {fileURLToPath} from "url";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";

export default class Ide extends CommandInterface {
    static commandLineArguments = {} as const;
    config = CLIParser.getCommandLineArgumentsValues(Ide.commandLineArguments);

    async run(): Promise<void> {
        const port = await getNextAvailablePort();
        fork(fileURLToPath(new URL("./dist/server/index.mjs", import.meta.url)), ["--port", port.toString()],{stdio: "inherit"});
        console.log(`FullStacked IDE is running at http://localhost:${port}`);
    }

    runCLI(): Promise<void> {
        return this.run();
    }
}
