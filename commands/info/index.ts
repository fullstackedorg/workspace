import CommandInterface from "../CommandInterface";
import CLIParser from "../../utils/CLIParser";
import crypto from "crypto";
import {resolve} from "path";
import fs from "fs";
import {execSync} from "child_process";
import version from "../../version";
import randStr from "fullstacked/utils/randStr";

export default class Info extends CommandInterface {
    static commandLineArguments = {
        packageJson: {
            type: "string",
            short: "p",
            description: "package.json location",
            defaultDescription: "./package.json"
        },
        name: {
            type: "string",
            short: "n",
            description: "Web App name",
            defaultDescription: "package.json[name]"
        },
        version: {
            type: "string",
            short: "v",
            description: "Web App version",
            defaultDescription: "package.json[version]"
        },
        hash: {
            type: "string",
            short: "h",
            description: "Web App hash",
            defaultDescription: "git rev-parse --short HEAD"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Info.commandLineArguments);

    constructor() {
        super();

        const packageJsonFilePath = this.config.packageJson
            ? resolve(process.cwd(), this.config.packageJson)
            : resolve(process.cwd(), "package.json");

        let packageJsonData;
        if(fs.existsSync(packageJsonFilePath))
            packageJsonData = JSON.parse(fs.readFileSync(packageJsonFilePath).toString());

        this.config = {
            ...this.config,
            name: this.config.name ?? packageJsonData?.name ?? randStr(),
            version: this.config.version ?? packageJsonData?.version ?? "0",
            hash: this.config.hash ?? this.getGitShortCommitHash() ?? crypto.randomBytes(6).toString('hex')
        }
    }

    private getGitShortCommitHash(){
        try{
            const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
            return commitHash.startsWith("fatal") ? "" : commitHash;
        }
        catch (e){
            return ""
        }
    }

    run(): void {
        console.log(`${this.config.name} v${this.config.version}-${this.config.hash}`);
        console.log(`FullStacked v${version}`);
    }

    runCLI(): void {
        this.run();
    }
}
