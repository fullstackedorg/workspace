import CommandInterface from "fullstacked/commands/CommandInterface";
import {CMD} from "fullstacked/types/gui";
import CLIParser from "fullstacked/utils/CLIParser";
import {exec, execSync} from "child_process";
import fs from "fs";

export default class Watch extends CommandInterface {
    static commandLineArguments = {
        builder: {
            short: "b",
            type: "string",
            default: "npx fullstacked build -v",
            defaultDescription: "npx fullstacked build -v",
            description: "Supply a command that builds your Web App and output the list of files to watch"
        },
        runner: {
            short: "r",
            type: "string",
            default: "npx fullstacked run --restart node -a node",
            defaultDescription: "npx fullstacked run -a --restart node",
            description: "Supply a command that runs your Web App"
        },
        interval: {
            short: "i",
            type: "number",
            default: 1000,
            defaultDescription: "1000",
            description: "Change how often the target files should be polled in milliseconds\nhttps://nodejs.org/docs/latest/api/fs.html#fswatchfilefilename-options-listener"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Watch.commandLineArguments);

    watchingFiles: Set<string> = new Set();

    guiCommands(): { cmd: CMD; callback(data, tick?: () => void): any }[] {
        return [];
    }

    watchFileListener(this: {file: string, instance: Watch}){
        console.log(`File Change Detected [${this.file}]`);
        this.instance.run();
    }

    buildAndWatch(){
        const rawFilesOutput = execSync(this.config.builder).toString();
        const filesToWatch = new Set(rawFilesOutput
            .split("\n")
            .map(line => line.split(","))
            .flat()
            .map(item => item.trim())
            .filter(filename => fs.existsSync(filename)));

        // diff currently watch with new set of files
        this.watchingFiles.forEach(file => {
            if(filesToWatch.has(file)) {
                filesToWatch.delete(file);
                return;
            }

            // no need to watch file anymore
            fs.unwatchFile(file, this.watchFileListener);
            this.watchingFiles.delete(file);
        });

        if(filesToWatch.size)
            console.log(`${filesToWatch.size} files added to watch`);

        // we have leftover files to start watching
        filesToWatch.forEach(file => {
            fs.watchFile(file, {interval: this.config.interval}, this.watchFileListener.bind({instance: this, file}));
            this.watchingFiles.add(file);
        });
    }

    run(): void {
        this.buildAndWatch();

        const runProcess = exec(this.config.runner);
        runProcess.stdout.pipe(process.stdout);
        runProcess.stderr.pipe(process.stderr);
    }

    runCLI(): void {
        this.run();
    }

}
