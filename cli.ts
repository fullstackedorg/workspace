#!/usr/bin/env node
import CLIParser from "./utils/CLIParser";
import fs from "fs";
import CommandInterface from "./CommandInterface";
import Table, {HorizontalAlignment} from 'cli-table3';
import {dirname} from "path";

const {help} = CLIParser.getCommandLineArgumentsValues({
    help: {
        type: "boolean",
        short: "h",
        description: "Get help"
    }
});

const commandName = CLIParser.commandLinePositional;

function getCommandLocation(commandName: string){
    const currentDirectory  = dirname(import.meta.url);
    const devLocation       = new URL(`${currentDirectory}/packages/${commandName}/index.js`);
    const installedLocation = new URL(`${currentDirectory}/../@fullstacked/${commandName}/index.js`);
    return fs.existsSync(devLocation)
        ? devLocation
        : fs.existsSync(installedLocation)
            ? installedLocation
            : null;
}

const commands = [
    {
        name: "build",
        description: "Build your Web App source code into a ready to run bundle"
    },
    {
        name: "run",
        description: "Run your Web App"
    },
    {
        name: "watch",
        description: "Automatically reBuild and reRun your Web App on file changes"
    },
    {
        name: "deploy",
        description: "Send your bundled Web App to a remote host"
    },
    {
        name: "backup",
        description: "Extract and put back archives of your Web App data"
    },
    {
        name: "info",
        description: "Output your Web App name, version and commit hash"
    }
]


if(!commandName) {
    if(help){
        const table = new Table({
            head: ["Command", "Installed", "Description"],
            style: {
                head: ["blue"]
            }
        });
        table.push(...(commands.map(command => ([
            command.name,
            {hAlign: "center" as HorizontalAlignment, content: getCommandLocation(command.name) ? "✓" : "x"},
            command.description
        ]))));
        console.log("\n  Usage: npx fullstacked [COMMAND] [ARGS...]\n");
        console.log(table.toString());
        process.exit(0);
    }


    throw Error("Could not find command in command line");
}

if(!commands.find(command => command.name === commandName)){
    console.log(`[${commandName}] is not a FullStacked command`);
    console.log(`If you need help, run [ npx fullstacked --help ]`);
    process.exit(0);
}

const commandLocation = getCommandLocation(commandName);

if(!commandLocation)
    throw Error(`Could not locate command [${commandName}]. Maybe try to install it [ npm i @fullstacked/${commandName} ]`);

const CommandModule = await import(commandLocation.toString());

const command: CommandInterface = new CommandModule.default();

if(help){
    const argsSpecs = CommandModule.default.commandLineArguments;
    const args = Object.keys(argsSpecs);
    const outputTable = new Table({
        head: ["Argument", "Default", "Description"],
        style: {
            head: ["blue"]
        }
    });
    args.forEach(argName => {
        const argSpec = argsSpecs[argName];
        outputTable.push([
            "--" + argName + (argSpec.short ? ", -" + argSpec.short : ""),
            argSpec.defaultDescription ?? "",
            argSpec.description
        ])
    })
    console.log(`\n  ${commands.find(command => command.name === commandName).description}\n`)
    console.log(`  Usage: npx fullstacked ${commandName} [ARGS...]\n`)
    console.log(outputTable.toString());
}else{
    command.runCLI();
}
