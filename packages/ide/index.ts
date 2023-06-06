import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import {fileURLToPath} from "url";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";

export default class Ide extends CommandInterface {
    static commandLineArguments = {} as const;
    config = CLIParser.getCommandLineArgumentsValues(Ide.commandLineArguments);

    async run(): Promise<void> {
        // @ts-ignore
        const {server} = await import("./dist/server/index.mjs");
        const port = await getNextAvailablePort();
        server.port = port;
        server.clientDir = fileURLToPath(new URL("./dist/client", import.meta.url));
        server.logger = null;
        server.pages["/"].addStyle("/index.css");
        server.pages["/"].addScript("/index.js");
        server.start();
        console.log(`FullStacked IDE is running at http://localhost:${port}`);
    }

    runCLI(): Promise<void> {
        return this.run();
    }
}
