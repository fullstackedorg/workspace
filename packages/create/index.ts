import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import install from "./install";
import Info from "fullstacked/info";
import { dirname } from "path";

export default class Create extends CommandInterface {
    static commandLineArguments = {
        templates: {
            short: "t",
            type: "string[]",
            description: "Templates to install. View available here\nhttps://github.com/cplepage/create-fullstacked/tree/main/templates"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Create.commandLineArguments);

    run() {
        return install(this.config.templates, dirname(Info.packageJsonFilePath));
    }

    runCLI() {
        return this.run();
    }
}
