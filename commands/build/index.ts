import CommandInterface from "fullstacked/commands/CommandInterface";
import {CMD} from "fullstacked/types/gui";
import CLIParser from "fullstacked/utils/CLIParser";

export default class Build extends CommandInterface {
    static commandLineArguments = {
        client: {
            type: "string[]",
            short: "c",
            description: "Client entry points to be bundled",
        },
        server: {
            type: "string",
            short: "s",
            description: "Server entry points to be bundled"
        },
        dockerCompose: {
            type: "string",
            short: "d",
            description: "Docker Compose files to be bundled"
        },
        outputDir: {
            type: "string",
            short: "o",
            description: "Output directory where all the bundled files will output",
        },
        production: {
            type: "boolean",
            short: "p",
            description: "Build in production mode"
        },
        externalModules: {
            type: "string[]",
            description: "Ignore modules when building"
        },
        verbose: {
            type: "boolean",
            short: "v",
            description: "Output all built files"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Build.commandLineArguments);

    guiCommands(): { cmd: CMD; callback(data, tick?: () => void): any }[] {
        return [];
    }

    run(): void {

    }

    runCLI(): void {
        this.run();
    }

}
