#!/usr/bin/env node
import CLIParser from "fullstacked/utils/CLIParser";
import Table from "cli-table3";
import {argsSpecs} from "./args";

const commands = [
    {
        name: "create",
        description: "Create a new FullStacked Web App. Default command."
    }
]

const {help} = CLIParser.getCommandLineArgumentsValues({
    help: {
        short: "h",
        type: "boolean"
    }
});

const command = CLIParser.commandLinePositional ?? commands.at(0).name;

if(help){
    console.log(`\n  Usage: npm init @fullstacked [ARGS...]\n`);

    const commandsTable = new Table({
        head: ["Command", "Description"],
        style: {
            head: ["blue"]
        }
    });
    commands.forEach(command => {
        commandsTable.push([
            command.name,
            command.description
        ])
    })
    console.log(commandsTable.toString());

    const argumentsTable = new Table({
        head: ["Argument", "Default", "Description"],
        style: {
            head: ["blue"]
        }
    });
    Object.keys(argsSpecs).forEach(argName => {
        const argSpec = argsSpecs[argName];
        argumentsTable.push([
            "--" + argName + (argSpec.short ? ", -" + argSpec.short : ""),
            argSpec.defaultDescription ?? "",
            argSpec.description
        ])
    })
    console.log(argumentsTable.toString());

    process.exit(0);
}

if(!commands.find(com => com.name === command))
    throw Error(`Unknown command [${command}]`);

const commandModule = await import(`./${command}.js`);
await commandModule.default();
