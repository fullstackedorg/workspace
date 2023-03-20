import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import install from "./install";
import {argsSpecs} from "./args";

export default class Create extends CommandInterface {
    static commandLineArguments = argsSpecs;
    config = CLIParser.getCommandLineArgumentsValues(Create.commandLineArguments);

    run() {
        return install();
    }

    runCLI() {
        return this.run();
    }
}
