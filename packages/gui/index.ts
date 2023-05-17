import CommandInterface from "fullstacked/CommandInterface";
import {fileURLToPath} from "url";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";

export default class GUI extends CommandInterface {
    async run() {
        const port = await getNextAvailablePort();
        console.log(`FullStacked GUI is running at http://localhost:${port}`);

        // @ts-ignore
        const {server} = await import("./dist/server/index.mjs");
        server.port = port;
        server.clientDir = fileURLToPath(new URL("./dist/client", import.meta.url));
        server.logger = null;
        server.pages["/"].addStyle("/index.css");
        server.pages["/"].addScript("/index.js");
        server.start();
    }

    runCLI() {
        return this.run();
    }

}
