import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import install from "./install";
import {argsSpecs} from "./args";
import create from "./create";

export default class Create extends CommandInterface {
    static commandLineArguments = {
        ...argsSpecs,
        new: {
            short: "n",
            type: "boolean",
            default: false,
            defaultDescription: "false",
            description: "Create a new fullstacked project"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Create.commandLineArguments);

    run() {
        if(this.config.new)
            return create();
        return install();
    }

    runCLI() {
        return this.run();
    }
}
