import CommandInterface from "fullstacked/commands/CommandInterface";
import {CMD} from "fullstacked/types/gui";
import CLIParser from "fullstacked/utils/CLIParser";
import {ChildProcess, exec, execSync} from "child_process";
import fs from "fs";
import WebSocket, {WebSocketServer} from "ws";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";
import {fullstackedClientWatcher} from "fullstacked/utils/paths";
import os from "os";
import readline from "readline";
import * as process from "process";

export default class Watch extends CommandInterface {
    static commandLineArguments = {
        builder: {
            short: "b",
            type: "string",
            default: `npx fullstacked build -w ${fullstackedClientWatcher} -v`,
            defaultDescription: "npx fullstacked build -w fullstacked/client/watcher.ts -v",
            description: "Provide a command that builds your Web App and outputs the list of files to watch"
        },
        start: {
            short: "s",
            type: "string",
            default: "npx fullstacked run -a node",
            defaultDescription: "npx fullstacked run -a node",
            description: "Provide a command that starts your Web App"
        },
        restart: {
            short: "r",
            type: "string",
            defaultDescription: "Uses start",
            description: "Provide a command that restarts your Web App"
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

    wss: WebSocketServer;
    ws: Set<WebSocket> = new Set();

    runProcess: ChildProcess;

    guiCommands(): { cmd: CMD; callback(data, tick?: () => void): any }[] {
        return [];
    }

    watchFileListener(this: {file: string, instance: Watch}){
        console.log(`File Change Detected [${this.file.slice(process.cwd().length)}]`);
        this.instance.restart();
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

    async startWatchServer(){
        const port = await getNextAvailablePort();
        this.wss = new WebSocketServer({port: port});
        this.wss.on('connection', (ws) => {
            this.ws.add(ws);
            ws.on('close', () => this.ws.delete(ws));
        });
        console.log(`Watcher WebSocket Server is listening at http://localhost:${this.wss.options.port}`);
    }

    restart(){
        this.runProcess.kill();

        this.buildAndWatch();

        this.ws.forEach(ws => ws.send(Date.now()));

        this.runProcess = exec(this.config.restart || this.config.start);
        this.runProcess.stdout.pipe(process.stdout);
        this.runProcess.stderr.pipe(process.stderr);
    }

    async run() {
        if(this.config.start === Watch.commandLineArguments.start.default) {
            this.config = {
                ...this.config,
                restart: this.config.start + " -r"
            }
        }

        await this.startWatchServer();

        this.buildAndWatch();
        this.runProcess = exec(this.config.start);
        this.runProcess.stdout.pipe(process.stdout);
        this.runProcess.stderr.pipe(process.stderr);
    }

    runCLI() {
        return this.run();
    }

}
