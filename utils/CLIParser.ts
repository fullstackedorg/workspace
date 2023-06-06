type CommandLineArgumentSpecCommon = {
    short?: string,
    description?: string,
    defaultDescription?: string
}

type CommandLineArgumentSpecString = CommandLineArgumentSpecCommon & {
    type: "string",
    default?: string
}
type CommandLineArgumentSpecStringArray = CommandLineArgumentSpecCommon & {
    type: "string[]",
    default?: string[]
}
type CommandLineArgumentSpecNumber = CommandLineArgumentSpecCommon & {
    type: "number",
    default?: number
}
type CommandLineArgumentSpecBoolean = CommandLineArgumentSpecCommon & {
    type: "boolean",
    default?: boolean
}

type CommandLineArgumentSpec = CommandLineArgumentSpecString |
    CommandLineArgumentSpecStringArray |
    CommandLineArgumentSpecNumber |
    CommandLineArgumentSpecBoolean

export type CommandLineArgumentsSpecs = { [argName: string]: CommandLineArgumentSpec };

type ParsedCommandLineArgument<T> =
    T extends CommandLineArgumentSpecString
        ? string
        : T extends CommandLineArgumentSpecStringArray
            ? string[]
            : T extends CommandLineArgumentSpecNumber
                ? number
                : T extends CommandLineArgumentSpecBoolean
                    ? boolean
                    : never;

export default class CLIParser {
    static commandLineTokens: { [key: string]: string[] };
    static commandLinePositional: string;

    static parseCommandLineArguments(){
        const args = process.argv.slice(2);

        if(!args.at(0)?.startsWith("-"))
            this.commandLinePositional = args.shift();

        this.commandLineTokens = {};

        let currentArgumentParsing: string;
        for (const arg of args){
            if(arg.startsWith("-")){

                // split if --arg=value
                const startToken = arg.includes("=")
                    ? arg.split("=").shift()
                    : arg;

                // remove 1 if -arg, 2 if --arg
                currentArgumentParsing = startToken.startsWith("--")
                    ? startToken.slice(2)
                    : startToken.slice(1);

                // add to our property
                this.commandLineTokens[currentArgumentParsing] = [];

                // if --arg=value, add value to arg
                if(arg.includes("="))
                    this.commandLineTokens[currentArgumentParsing] = [arg.split("=").pop()];

                continue;
            }

            if(!currentArgumentParsing)
                throw Error("Parsing Argument Value without known argument key");

            this.commandLineTokens[currentArgumentParsing].push(arg);
        }
    }

    static getCommandLineArgumentsValues<T extends CommandLineArgumentsSpecs, U extends { [K in keyof T]: ParsedCommandLineArgument<T[K]> }>(argsSpec: T) : U {
        if(!this.commandLineTokens)
            this.parseCommandLineArguments();

        let parsedValues = {};
        for (const argName of Object.keys(argsSpec)) {
            const argSpec = argsSpec[argName];
            const rawValue = this.commandLineTokens[argName] || this.commandLineTokens[argSpec.short];

            if(!rawValue) {
                parsedValues[argName] = null
            }
            else if (argSpec.type === "string"){
                if(rawValue.length > 1)
                    throw Error(`More than one value for argument ${argName} [${rawValue.toString()}]`);

                parsedValues[argName] = rawValue.length === 0
                    ? null
                    : rawValue.at(0);
            }
            else if(argSpec.type === "string[]"){
                parsedValues[argName] = rawValue;
            }
            else if(argSpec.type === "boolean"){
                parsedValues[argName] = Boolean(rawValue);
            }
            else if(argSpec.type === "number"){
                parsedValues[argName] = Number(rawValue);
            }

            if((parsedValues[argName] === null || parsedValues[argName] === undefined) && argSpec.default)
                parsedValues[argName] = argSpec.default;
        }

        return parsedValues as U;
    }

    static reconstructCommandLineArguments(){
        console.log(this.commandLineTokens);
        return ""
    }
}
