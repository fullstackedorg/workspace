import CommandInterface from "fullstacked/CommandInterface";
import {fork} from "child_process";
import {fileURLToPath} from "url";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";

export default class GUI extends CommandInterface {
    async run() {
        const port = await getNextAvailablePort();

        fork(fileURLToPath(new URL("./dist/app/index.mjs", import.meta.url)), ["--port", port.toString()],{stdio: "inherit"});

        console.log(`FullStacked GUI is running at http://localhost:${port}`);
    }

    runCLI() {
        return this.run();
    }

}
