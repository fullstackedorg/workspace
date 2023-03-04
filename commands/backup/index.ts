import CommandInterface from "fullstacked/commands/CommandInterface";
import {CMD} from "fullstacked/types/gui";
import CLIParser from "fullstacked/utils/CLIParser";
import fs from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import type Deploy from "../deploy";

const __dirname = dirname(fileURLToPath(import.meta.url));

// source: https://stackoverflow.com/a/43001581
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const DeployModule = (fs.existsSync(resolve(__dirname, "..", "deploy", "index.js"))
    ? (await import("@fullstacked/deploy/index.js")).default
    : null) as typeof Deploy;

const deployCommandLineArgs = (DeployModule
    ? DeployModule.commandLineArguments
    : {}) as Writeable<typeof Deploy.commandLineArguments>;

delete deployCommandLineArgs.dryRun;
delete deployCommandLineArgs.outputDir;

export default class Backup extends CommandInterface {
    static commandLineArguments = {
        volume: {
            type: "string[]",
            short: "v",
            defaultDescription: "All Volumes"
        },
        restore: {
            type: "boolean",
            short: "r",
            defaultDescription: "false",
            description: "Put back local backup into your running Web App"
        },
        backupDir: {
            type: "string",
            short: "b",
            defaultDescription: "./backup",
            default: resolve(process.cwd(), "backup"),
            description: "Define a local directory for your archives files"
        },
        remote: {
            type: "boolean",
            defaultDescription: "false",
            description: "Requires @fullstacked/deploy\nBackup or restore your remote host"
        },
        ...deployCommandLineArgs
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Backup.commandLineArguments);

    deploy = DeployModule ? new DeployModule() : null;

    restoreRemote(){

    }

    restoreLocally(){

    }

    backupRemote(){

    }

    backupLocally(){

    }

    guiCommands(): { cmd: CMD; callback(data, tick?: () => void): any }[] {
        return [];
    }

    run(): void {
        if(this.config.remote && !this.deploy)
            throw Error("Install the Deploy command to backup and restore your remote server [npm i @fullstacked/deploy]");

        if(this.config.remote){
            if (this.config.restore)
                this.restoreRemote();
            else
                this.backupRemote();
        }else{
            if(this.config.restore)
                this.restoreLocally();
            else
                this.backupLocally();
        }
    }

    async runCLI() {
        await this.deploy?.setupCredentialsWithConfigAndPrompts();
        this.run();
    }

}
