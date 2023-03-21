import CommandInterface from "fullstacked/CommandInterface";
import CLIParser from "fullstacked/utils/CLIParser";
import {ChildProcess, exec, execSync} from "child_process";
import fs from "fs";
import WebSocket, {WebSocketServer} from "ws";
import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";
import {createServer} from "http";
import httpProxy from "http-proxy";
import harmon from "harmon";
import Info from "fullstacked/info";
import sleep from "fullstacked/utils/sleep";

export default class Watch extends CommandInterface {
    static commandLineArguments = {
        builder: {
            short: "b",
            type: "string",
            default: `npx fullstacked build -v`,
            defaultDescription: `npx fullstacked build -v`,
            description: "Provide a command that builds your Web App and outputs the list of files to watch"
        },
        start: {
            short: "s",
            type: "string",
            default: "npx fullstacked run -r -a node",
            defaultDescription: "npx fullstacked run -r -a node -n [available port]",
            description: "Provide a command that starts your Web App"
        },
        restart: {
            short: "r",
            type: "string",
            defaultDescription: "Uses start",
            description: "Provide a command that restarts your Web App"
        },
        portFinder: {
            type: "string",
            default: "docker inspect --format=\"{{(index (index .NetworkSettings.Ports \\\"80/tcp\\\") 0).HostPort}}\"",
            defaultDescription: "docker inspect --format=\"{{(index (index .NetworkSettings.Ports \\\"80/tcp\\\") 0).HostPort}}\" [node_container_name]",
            description: "Provide a command to find on which port your web app runs"
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

    ws: Set<WebSocket> = new Set();

    runProcess: ChildProcess;

    watchFileListener(this: {file: string, instance: Watch}){
        console.log(`File Change Detected [${this.file.slice(process.cwd().length)}]`);
        this.instance.restart();
    }

    buildAndWatch(){
        let rawFilesOutput = "";
        try{
            rawFilesOutput = execSync(this.config.builder).toString();
        }catch (e) {
            console.log(e);
        }

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
        let webAppPort;
        while (!webAppPort || isNaN(webAppPort)){
            try{
                webAppPort = parseInt(execSync(this.config.portFinder).toString());
            }catch (e){
                await sleep(1000);
            }
        }

        const watcherScript = `<script>
            ${fs.readFileSync(new URL("./clientWatcher.js", import.meta.url)).toString()}
</script>`;

        const proxyPort = await getNextAvailablePort();
        const proxy = httpProxy.createServer();

        const watcherInject = harmon([], [{
            query: "body",
            func(node) {
                const stream = node.createStream({ "outer" : false });
                let content = '';
                stream.on('data', (data) => content += data);
                stream.on('end', () => stream.end(content + watcherScript));
            }
        }], true);
        const server = createServer((req, res) => {
            watcherInject(req, res, () =>
                proxy.web(req, res, {target: `http://localhost:${webAppPort}`}, () => {
                    res.writeHead(500);
                    res.end("Web App down");
                }));
        });

        const wss = new WebSocketServer({ noServer: true });
        server.on('upgrade', (req, socket, head) => {
            if(req.url !== "/fullstacked-ws"){
                proxy.ws(req, socket, head, {target: `ws://localhost:${webAppPort}`}, () => {});
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        });

        wss.on('connection', (ws) => {
            this.ws.add(ws);
            ws.on('close', () => this.ws.delete(ws));
        });

        server.listen(proxyPort);

        console.log(`WebApp is proxied with Web Socket Watcher at http://localhost:${proxyPort}`);
    }

    restart(){
        this.runProcess.kill("SIGINT");
        this.runProcess.stdout.unpipe(process.stdout);
        this.runProcess.stderr.unpipe(process.stderr);

        this.buildAndWatch();

        this.ws.forEach(ws => ws.send(Date.now()));

        this.runProcess = exec(this.config.restart || this.config.start);
        this.runProcess.stdout.pipe(process.stdout);
        this.runProcess.stderr.pipe(process.stderr);
    }

    async run() {
        this.buildAndWatch();

        this.runProcess = exec(this.config.start);
        this.runProcess.stdout.pipe(process.stdout);
        this.runProcess.stderr.pipe(process.stderr);

        if(this.config.portFinder === Watch.commandLineArguments.portFinder.default){
            this.config = {
                ...this.config,
                portFinder: this.config.portFinder + " " + Info.webAppName + "_node_1"
            }
        }

        await this.startWatchServer();
    }

    runCLI() {
        return this.run();
    }

}
