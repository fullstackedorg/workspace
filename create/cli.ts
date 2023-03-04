#!/usr/bin/env node
import CLIParser from "fullstacked/utils/CLIParser";
import Table from "cli-table3";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {argsSpecs} from "./args";

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = [
    {
        name: "create",
        description: "Create a new FullStacked Web App. Default command."
    },
    {
        name: "install",
        description: "Install a template to your Web App"
    },
    {
        name: "remove",
        description: "Remove a template from your Web App"
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
    console.log(`\n  Usage: npm init @fullstacked [COMMAND] [ARGS...]\n`);

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

try{
    await import(resolve(__dirname, command + ".js"));
}catch (e) {
    console.log(e)
}
const commandModule = await import(resolve(__dirname, command + ".js"));
commandModule.default();
