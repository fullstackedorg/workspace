import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import {argsSpecs} from "./args";
import create from "./create";

export default class Create extends CommandInterface {
    static commandLineArguments = argsSpecs;
    config = CLIParser.getCommandLineArgumentsValues(Create.commandLineArguments);

    run() {
        return create();
    }

    runCLI() {
        return this.run();
    }
}
