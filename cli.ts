#!/usr/bin/env node
import CLIParser from "./utils/CLIParser";
import fs from "fs";
import CommandInterface from "./CommandInterface";
import Table, {HorizontalAlignment} from 'cli-table3';
import {dirname, resolve} from "path";
import Info from "./info";
import FullStackedVersion from "./version";
import Commands from "./Commands";
import {fileURLToPath} from "url";
import getModuleDir from "./utils/getModuleDir";

const {help, version, packageJson} = CLIParser.getCommandLineArgumentsValues({
    packageJson: {
        type: "string",
        short: "p",
        description: "package.json location",
        default: "./package.json",
        defaultDescription: "./package.json"
    },
    help: {
        type: "boolean",
        short: "h",
        description: "Get help"
    },
    version: {
        type: "boolean",
        short: "v",
        description: "Output your Web App and FullStacked versions"
    }
});

Info.init(packageJson);

const commandName = CLIParser.commandLinePositional;

async function getCommandLocation(commandName: string){
    const currentDirectory  = dirname(import.meta.url);
    const devLocation       = new URL(`${currentDirectory}/packages/${commandName}`);
    return fs.existsSync(devLocation)
        ? devLocation
        : await getModuleDir(`@fullstacked/${commandName}`);
}

async function getCommandPackageInfos(commandName: string){
    const location = await getCommandLocation(commandName);
    if(!location) return null;
    const dir = fileURLToPath(location);
    const infos = JSON.parse(fs.readFileSync(resolve(dir, "package.json")).toString());
    return {
        location,
        version: infos.version,
        description: infos.description
    };
}

if(!commandName) {
    if(help){
        const table = new Table({
            head: ["Command", "Installed", "Version", "Description"],
            style: {
                head: ["blue"]
            }
        });
        for (let i = 0; i < Commands.length; i++) {
            const command = Commands[i];
            const infos = await getCommandPackageInfos(command);
            table.push([
                command,
                {hAlign: "center" as HorizontalAlignment, content: infos?.location ? "✓" : "x"},
                infos?.version ?? "-",
                infos?.description
            ])
        }

        console.log("\n  Usage: npx fullstacked [COMMAND] [ARGS...]\n");
        console.log(table.toString());
        process.exit(0);
    }else if(version){
        console.log(`${Info.webAppName} v${Info.version}-${Info.hash}`);
        console.log(`FullStacked v${FullStackedVersion}`);
        process.exit(0);
    }


    throw Error("Could not find command in command line");
}

if(!Commands.find(command => command === commandName)){
    console.log(`[${commandName}] is not a FullStacked command`);
    console.log(`If you need help, run [ npx fullstacked --help ]`);
    process.exit(0);
}

const commandLocation = await getCommandLocation(commandName);

if(!commandLocation)
    throw Error(`Could not locate command [${commandName}]. Maybe try to install it [ npm i @fullstacked/${commandName} ]`);

const CommandModule = await import(commandLocation.toString() + "/index.js");

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
    const packageInfo = await getCommandPackageInfos(commandName);
    console.log(`\n  ${packageInfo.description}\n`)
    console.log(`  Usage: npx fullstacked ${commandName} [ARGS...]\n`)
    console.log(outputTable.toString());
}else{
    command.runCLI();
}
