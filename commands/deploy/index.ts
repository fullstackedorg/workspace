import CommandInterface from "fullstacked/commands/CommandInterface";
import {dirname, resolve} from "path";
import CLIParser from "fullstacked/utils/CLIParser";
import prompts from "prompts";
import fs from "fs";
import ServerSSH from "./serverSSH";
import SFTP from "ssh2-sftp-client";
import {Client} from "ssh2";
import yaml from "js-yaml";
import {fileURLToPath} from "url";
import Info from "fullstacked/commands/info";
import {globSync} from "glob";
import progress from "progress-stream";
import DockerInstallScripts from "./dockerInstallScripts";
import {Writable} from "stream";
import randStr from "fullstacked/utils/randStr";
import dns from "dns";
import {decryptDataWithPassword, encryptDataWithPassword} from "fullstacked/utils/encrypt";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type CredentialsSSH = {
    host: string,
    port: number,
    username: string,
    password?: string,
    privateKey?: string,
    directory: string
}

export type NginxConfig = {
    name: string,
    port: number,
    serverNames?: string[],
    nginxExtraConfigs?: string[],
    customPublicPort?: {
        port: number,
        ssl: boolean
    }
}

type NginxFile = {
    fileName: string,
    content: string
}

export type CertificateSSL = {
    fullchain: string,
    privkey: string
}

type WrappedSFTP = SFTP & {
    client: Client
}

export default class Deploy extends CommandInterface {
    static commandLineArguments = {
        host: {
            type: "string",
            description: "Server IP address or hostname",
        },
        port: {
            type: "number",
            default: 22,
            description: "Server SSH port",
            defaultDescription: "22"
        },
        username: {
            type: "string",
            description: "Server SSH username",
        },
        password: {
            type: "string",
            description: "Authenticate with password",
        },
        privateKey: {
            type: "string",
            description: "Authenticate with a private key",
        },
        privateKeyFile: {
            type: "string",
            description: "Authenticate with a file containing your private key",
        },
        hostDir: {
            type: "string",
            default: "/home",
            defaultDescription: "/home",
            description: "Server directory where your FullStacked Web Apps are"
        },
        outputDir: {
            type: "string",
            short: "o",
            default: resolve(process.cwd(), "dist"),
            defaultDescription: "./dist",
            description: "Built Web App directory"
        },
        dryRun: {
            type: "boolean",
            description: "Simulate a deployment on a local Docker-in-Docker container emulating a Linux remote server"
        },
        configFile: {
            type: "string",
            defaultDescription: "./.fullstacked",
            description: "Define the location of your saved configs"
        },
        configPassword: {
            type: "string",
            description: "Password to decrypt your saved configs"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Deploy.commandLineArguments);

    webAppInfo = new Info();

    credentialsSSH: CredentialsSSH;
    nginxConfigs: NginxConfig[] = [];
    certificateSSL: CertificateSSL;

    sftp: WrappedSFTP;

    askToInstallDockerOnRemoteHost: () => Promise<boolean>;

    async execOnRemoteHost(cmd: string): Promise<string>{
        const {client} = await this.getSFTP();

        return new Promise(resolve => {
            const message = [];

            client.exec(cmd, (err, stream) => {
                if (err) throw err;

                stream.on('data', chunk => {
                    message.push(chunk);
                });
                stream.on('error', chunk => {
                    message.push(chunk);
                })
                stream.on('close', () => resolve(message.toString()));
            });
        });
    }

    /**
     *
     * Setup credentialsSSH with prompts
     *
     */
    async setupCredentialsWithConfigAndPrompts(){
        if(!this.config.host) {
            const {host} = await prompts({
                type: "text",
                name: "host",
                message: "Enter your remote server IP or hostname"
            });
            this.config = {
                ...this.config,
                host
            }
        }

        if (!this.config.username) {
            const {username} = await prompts({
                type: "text",
                name: "username",
                message: "Enter your remote server SSH username"
            });
            this.config = {
                ...this.config,
                username
            }

            const {hostDir} = await prompts({
                type: "text",
                name: "hostDir",
                initial: "/home/" + username,
                message: "Define your remote host directory where FullStacked can run your Web Apps"
            });
            this.config = {
                ...this.config,
                hostDir
            }
        }

        if(!this.config.password && !this.config.privateKey && !this.config.privateKeyFile){
            const {authType} = await prompts({
                type: "select",
                name: "authType",
                message: "Select auth type",
                choices: [
                    {title: "Password", value: "password"},
                    {title: "Private Key", value: "privateKey"},
                    {title: "Private Key File", value: "privateKeyFile"},
                ]
            });

            const {value} = await prompts({
                type: authType === "password" ? "password" : "text",
                name: "value",
                message: `Enter your SSH ${authType}`
            });

            this.config = {
                ...this.config,
                [authType]: value
            }
        }

        this.credentialsSSH = {
            host: this.config.host,
            port: this.config.port,
            username: this.config.username,
            directory: this.config.hostDir
        };

        if(this.config.password)
            this.credentialsSSH.password = this.config.password;
        else if(this.config.privateKey)
            this.credentialsSSH.privateKey = this.config.privateKey;
        else if(this.config.privateKeyFile)
            this.credentialsSSH.privateKey = fs.readFileSync(resolve(process.cwd(), this.config.privateKeyFile)).toString();
    }

    async setupNginxConfigsWithPrompts(){
        const dockerCompose = yaml.load(fs.readFileSync(resolve(this.config.outputDir, "docker-compose.yml")).toString());

        for (const serviceName of Object.keys(dockerCompose.services)) {
            const service = dockerCompose.services[serviceName];

            if(!service.ports || !service.ports.length)
                continue;

            for (const port of service.ports) {
                const internalPort = port.split(":").pop();

                const nginxConfig: NginxConfig = {
                    name: serviceName,
                    port: internalPort
                }

                const { setup } = await prompts({
                    type: "confirm",
                    name: "setup",
                    message: `Would you like to add server names for ${serviceName} port ${internalPort}`
                });

                if(setup) {
                    const { serverNames } = await prompts({
                        type: "list",
                        name: "serverNames",
                        message: "Enter the server names (split with commas)",
                    });

                    const { nginxExtraConfigs } = await prompts({
                        type: "text",
                        name: "nginxExtraConfigs",
                        message: "Enter any nginx extra configuration (ie: proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; )",
                    });

                    nginxConfig.serverNames = serverNames;
                    nginxConfig.nginxExtraConfigs = nginxExtraConfigs
                        .split(";")
                        .filter(config => Boolean(config.trim()))
                        .map(config => config.trim() + ";");
                }

                const { customPort } = await prompts({
                    type: "confirm",
                    name: "customPort",
                    message: `Would you like ${serviceName} port ${internalPort} to listen on a custom port ? Default is 80 and 443(SSL)`
                });

                if(customPort){
                    const { port } = await prompts({
                        type: "number",
                        name: "port",
                        message: "Which port?"
                    });

                    const { ssl } = await prompts({
                        type: "confirm",
                        name: "ssl",
                        message: "With SSL encryption?"
                    });

                    nginxConfig.customPublicPort = {
                        port,
                        ssl
                    }
                }

                this.nginxConfigs.push(nginxConfig);
            }
        }
    }

    async setupCertificatesWithPrompts(){
        const { setup } = await prompts({
            type: "confirm",
            name: "setup",
            message: "Would you like to create new SSL Certificates"
        })

        if(!setup) return;

        const { email } = await prompts({
            type: "text",
            name: "email",
            message: "Enter an email address that will receive notifications about the certificate"
        });

        const { domains } = await prompts({
            type: "multiselect",
            name: "domains",
            message: "Select domains to include in certificate",
            choices: this.nginxConfigs.map(nginxConfig => nginxConfig.serverNames?.map(serverName => ({
                title: serverName,
                value: serverName
            }))).flat(),
            instructions: false,
            hint: '- Space to select. Return to submit'
        });

        let allDomainPointingToHost = false;
        while(!allDomainPointingToHost){
            const { ready } = await prompts({
                type: "confirm",
                name: "ready",
                message: `Make sure you have an A record pointing to ${this.credentialsSSH.host} for each domain`
            });

            if(!ready) return;

            const success = [];
            for (const domain of domains) {
                try{
                    const lookupResult = await dns.promises.lookup(domain);
                    console.log(`${domain} resolves to [${lookupResult.address}]`);
                    success.push(lookupResult.address === this.credentialsSSH.host);
                }catch (e) {
                    console.log(`✖ Could not resolve [${domain}]`);
                    success.push(false);
                }
            }

            allDomainPointingToHost = success.every((lookup) => lookup);

            if(!allDomainPointingToHost){
                console.log("If you recently changed your DNS records. Try flushing yo DNS cache.")
                console.log("Windows: ipconfig /flushdns")
                console.log("MacOS: sudo killall -HUP mDNSResponder; sudo dscacheutil -flushcache")
            }
        }

        this.certificateSSL = await this.generateCertificateOnRemoteHost(email, domains);
    }

    /**
     *
     * Get sftp client in less than 3s
     *
     */
    async getSFTP(): Promise<WrappedSFTP>{
        if(this.sftp) return this.sftp;

        if(!this.credentialsSSH)
            throw Error("Trying to get connection to remote server without having set ssh credentials");

        const timeout = setTimeout(() => {
            try{
                this.sftp.end();
            }catch (e){ }
            throw Error("Hanging 3s to connect to remote server");
        }, 3000);

        this.sftp = new SFTP() as WrappedSFTP;
        await this.sftp.connect(this.credentialsSSH);

        clearTimeout(timeout);

        return this.sftp;
    }

    /**
     *
     * Test out if your SSH credentials work with the remote host.
     * Make sure the App Directory is writable to publish web apps.
     * Make sure Docker and Docker Compose is installed on remote host.
     *
     */
    async testRemoteServer(){
        // reset sftp
        if(this.sftp) {
            await this.sftp.end();
            this.sftp = null;
        }

        console.log("Testing connection with remote host");
        this.sftp = await this.getSFTP();
        console.log("Success!");

        console.log("Testing mkdir in App Directory");
        const testDir = `${this.credentialsSSH.directory}/${randStr()}`;
        if(await this.sftp.exists(testDir)){
            throw Error(`Test directory ${testDir} exist. Exiting to prevent any damage to remote server.`);
        }

        await this.sftp.mkdir(testDir, true);
        await this.sftp.rmdir(testDir);
        console.log("Success!");

        return true;
    }

    /**
     *
     * Try to install docker and docker-compose v2 on remote host for specific distro
     *
     */
    async tryToInstallDockerOnRemoteHost(){
        const sftp = await this.getSFTP();

        // https://github.com/docker/docker-install/blob/master/install.sh#L167
        const distroName = (await this.execOnRemoteHost(`. /etc/os-release && echo "$ID"`)).trim();

        console.log(distroName);
        if(DockerInstallScripts[distroName]){
            for(const cmd of DockerInstallScripts[distroName]) {
                console.log(cmd)
                await this.execOnRemoteHost(cmd);
            }
        }

        if(await this.testDockerOnRemoteHost()) return;

        const dockerInstallScript = await (await fetch("https://get.docker.com")).text();
        await sftp.put(Buffer.from(dockerInstallScript), "/tmp/get-docker.sh");
        await this.execOnRemoteHost("sh /tmp/get-docker.sh");
        await sftp.delete("/tmp/get-docker.sh");
    }

    /**
     *
     * Test Docker and Docker Compose v2 installation on remote host
     *
     */
    async testDockerOnRemoteHost(noThrow = false){
        const dockerTest = await this.execOnRemoteHost(`docker version`);
        if(!dockerTest) {
            if(noThrow) return false;

            const errorMessage = "Docker is not installed on the remote host.";

            if(this.askToInstallDockerOnRemoteHost){
                console.log(errorMessage);
                if(await this.askToInstallDockerOnRemoteHost())
                    await this.tryToInstallDockerOnRemoteHost();
                else
                    process.exit(1);
            }else{
                throw Error(errorMessage)
            }
        }

        const dockerComposeTest = await this.execOnRemoteHost(`docker compose version`);
        if(!dockerComposeTest){
            if(noThrow) return false;

            const errorMessage = "Docker Compose v2 is not installed on the remote host.";

            if(this.askToInstallDockerOnRemoteHost){
                console.log(errorMessage);
                if(await this.askToInstallDockerOnRemoteHost())
                    await this.tryToInstallDockerOnRemoteHost();
                else
                    process.exit(1);
            }else{
                throw Error(errorMessage)
            }
        }

        console.log("Docker and Docker Compose v2 is Installed");
        return true;
    }

    /**
     *
     * @return an array of available ports on remote host
     *
     */
    private async getAvailablePorts(count: number): Promise<string[]> {
        const sftp = await this.getSFTP();

        const getAvailablePortsScriptPath = this.credentialsSSH.directory + "/getAvailablePorts.js";
        await sftp.put(resolve(__dirname, "nginx", "getAvailablePorts.js"), getAvailablePortsScriptPath);

        const dockerNodeCommand = [
            "docker",
            "run",
            "--rm",
            `-v ${getAvailablePortsScriptPath}:/node/script.mjs`,
            `--network host`,
            "node:18-alpine",
            `node /node/script.mjs -c ${count}`
        ].join(" ");
        const portsRaw = await this.execOnRemoteHost(dockerNodeCommand);

        const availablePorts = portsRaw
            .split("\n")
            .filter(port => Boolean(port))
            .map(port => port.trim());

        if(availablePorts.length !== count)
            throw Error("Something went wrong when trying to get available ports on remote host.");

        return availablePorts;
    }

    /**
     *
     * Find available ports on remote host,
     * then setup docker-compose.yml and nginx-{service}-{port}.conf files.
     *
     */
    private async setupDockerComposeAndNginx(): Promise<{ nginxFiles: NginxFile[], dockerCompose: string }>{
        const dockerCompose = yaml.load(fs.readFileSync(resolve(this.config.outputDir, "docker-compose.yml")).toString());
        // set default to node if no nginx configs
        const availablePorts = await this.getAvailablePorts(this.nginxConfigs.length);

        const nginxFiles: NginxFile[] = [];

        if(this.certificateSSL){
            nginxFiles.push({
                fileName: "fullchain.pem",
                content: this.certificateSSL.fullchain
            });
            nginxFiles.push({
                fileName: "privkey.pem",
                content: this.certificateSSL.privkey
            });
            console.log("Added certificate")
        }

        const nginxTemplate = fs.readFileSync(resolve(__dirname, "nginx", "service.conf"), {encoding: "utf-8"});
        const generateNginxFile = (publicPort , serverNames, internalPort, extraConfigs) => nginxTemplate
            .replace(/\{PUBLIC_PORT\}/g, publicPort)
            .replace(/\{SERVER_NAME\}/g, serverNames?.join(" ") ?? "localhost")
            .replace(/\{PORT\}/g, internalPort)
            .replace(/\{EXTRA_CONFIGS\}/g, extraConfigs?.join("\n") ?? "");

        const nginxSSLTemplate = fs.readFileSync(resolve(__dirname, "nginx", "service-ssl.conf"), {encoding: "utf-8"});
        const generateNginxSSLFile = (publicPort , serverNames, internalPort, extraConfigs) => nginxSSLTemplate
            .replace(/\{PUBLIC_PORT\}/g, publicPort)
            .replace(/\{SERVER_NAME\}/g, serverNames?.join(" ") ?? "localhost")
            .replace(/\{PORT\}/g, internalPort)
            .replace(/\{EXTRA_CONFIGS\}/g, extraConfigs?.join("\n") ?? "")
            .replace(/\{APP_NAME\}/g, this.webAppInfo.config.name);

        this.nginxConfigs.forEach((nginxConfig, configIndex) => {
            const availablePort = availablePorts[configIndex];

            if(nginxConfig.customPublicPort?.port){

                const customNginxFile = nginxConfig.customPublicPort.ssl
                    ? generateNginxSSLFile(nginxConfig.customPublicPort.port.toString(), nginxConfig.serverNames, availablePort, nginxConfig.nginxExtraConfigs)
                    : generateNginxFile(nginxConfig.customPublicPort.port.toString(), nginxConfig.serverNames, availablePort, nginxConfig.nginxExtraConfigs);

                nginxFiles.push({
                    fileName: `${nginxConfig.name}-${nginxConfig.port}.conf`,
                    content: customNginxFile
                });
            } else {
                nginxFiles.push({
                    fileName: `${nginxConfig.name}-${nginxConfig.port}.conf`,
                    content: generateNginxFile("80", nginxConfig.serverNames, availablePort, nginxConfig.nginxExtraConfigs)
                });

                if(this.certificateSSL){
                    nginxFiles.push({
                        fileName: `${nginxConfig.name}-${nginxConfig.port}-ssl.conf`,
                        content: generateNginxSSLFile("443", nginxConfig.serverNames, availablePort, nginxConfig.nginxExtraConfigs)
                    });
                }
            }


            for (let i = 0; i < dockerCompose.services[nginxConfig.name].ports.length; i++) {
                const servicePort = dockerCompose.services[nginxConfig.name].ports[i].split(":").pop();
                if(servicePort !== nginxConfig.port.toString()) continue;

                dockerCompose.services[nginxConfig.name].ports[i] = `${availablePort}:${nginxConfig.port}`;
            }
        });

        const dockerComposeStr = yaml.dump(dockerCompose);
        console.log("Generated docker-compose.yml");

        return {
            nginxFiles,
            dockerCompose: dockerComposeStr
        };
    }

    async uploadFileWithProgress(localFilePath: string, remoteFilePath: string, prependStr = ""){
        const sftp = await this.getSFTP();

        let ulStream = fs.createReadStream(localFilePath);

        const progressStream = progress({ length: fs.statSync(localFilePath).size });

        progressStream.on('progress', progress => {
            this.printLine(`${prependStr}Uploading File ${progress.percentage.toFixed(2)}%`);
        });

        ulStream = ulStream.pipe(progressStream);

        return sftp.put(ulStream, remoteFilePath);
    }


    async uploadFilesToRemoteServer(nginxFiles: NginxFile[], dockerCompose: string){
        const sftp = await this.getSFTP();

        if(!await sftp.exists(`${this.credentialsSSH.directory}/${this.webAppInfo.config.name}`))
            await sftp.mkdir(`${this.credentialsSSH.directory}/${this.webAppInfo.config.name}`, true);

        const files = globSync("**/*", {cwd: this.config.outputDir})
        const localFiles = files.map(file => resolve(this.config.outputDir, file));
        const remotePath = `${this.credentialsSSH.directory}/${this.webAppInfo.config.name}`;

        for (let i = 0; i < files.length; i++) {
            const fileInfo = fs.statSync(localFiles[i]);
            if(fileInfo.isDirectory())
                await sftp.mkdir(remotePath + "/" + files[i]);
            else
                await this.uploadFileWithProgress(localFiles[i], remotePath + "/" + files[i], `[${i + 1}/${files.length}] `);
        }

        // nginx files
        const nginxRemoteDir = `${this.credentialsSSH.directory}/${this.webAppInfo.config.name}/nginx`;
        if(!await sftp.exists(nginxRemoteDir))
            await sftp.mkdir(nginxRemoteDir, true);

        for (const nginxFile of nginxFiles){
            await sftp.put(Buffer.from(nginxFile.content), `${nginxRemoteDir}/${nginxFile.fileName}`);
        }

        // docker compose file
        await sftp.put(Buffer.from(dockerCompose), `${this.credentialsSSH.directory}/${this.webAppInfo.config.name}/docker-compose.yml`);

        this.endLine();
    }

    /**
     *
     * Start up app on remote server
     *
     */
    async startAppOnRemoteServer(){
        console.log(`Starting ${this.webAppInfo.config.name} v${this.webAppInfo.config.version} on remote server`);
        await this.execOnRemoteHost(`docker compose -p ${this.webAppInfo.config.name} -f ${this.credentialsSSH.directory}/${this.webAppInfo.config.name}/docker-compose.yml up -d`);
        await this.execOnRemoteHost(`docker compose -p ${this.webAppInfo.config.name} -f ${this.credentialsSSH.directory}/${this.webAppInfo.config.name}/docker-compose.yml restart`);
    }

    /**
     *
     * Start FullStacked nginx on remote server
     *
     */
    async startFullStackedNginxOnRemoteHost(){
        const sftp = await this.getSFTP();

        const nginxDockerCompose = {
            services: {
                nginx: {
                    image: "nginx",
                    network_mode: "host",
                    container_name: "fullstacked-nginx",
                    volumes: [
                        "./:/apps",
                        "./root.conf:/etc/nginx/nginx.conf"
                    ],
                    restart: "always"
                }
            }
        };

        console.log(`Starting FullStacked Nginx on remote server`);
        await this.execOnRemoteHost(`sudo chmod -R 755 ${this.credentialsSSH.directory}`);
        await sftp.put(resolve(__dirname, "nginx", "root.conf"), `${this.credentialsSSH.directory}/root.conf`);
        await sftp.put(Buffer.from(yaml.dump(nginxDockerCompose)), `${this.credentialsSSH.directory}/docker-compose.yml`);
        await this.execOnRemoteHost(`docker compose -p fullstacked-nginx -f ${this.credentialsSSH.directory}/docker-compose.yml up -d`);
        await this.execOnRemoteHost(`docker compose -p fullstacked-nginx -f ${this.credentialsSSH.directory}/docker-compose.yml restart -t 0`);
    }

    /**
     *
     * Generate SSL certificate on remote host using certbot
     *
     */
    async generateCertificateOnRemoteHost(email: string, domains: string[]){
        const sftp = await this.getSFTP();
        console.log("Connected to remote host");

        await this.testDockerOnRemoteHost()

        let tempNginxDirRenamed = false;
        const nginxDir = `${this.credentialsSSH.directory}/${this.webAppInfo.config.name}/nginx`;
        if(await sftp.exists(nginxDir)){
            tempNginxDirRenamed = true;
            await sftp.rename(nginxDir, `${this.credentialsSSH.directory}/${this.webAppInfo.config.name}/_nginx`);
        }

        await sftp.mkdir(nginxDir, true);

        await sftp.put(Buffer.from(`server {
    listen              80;
    server_name         ${domains.join(" ")};
    root /apps/${this.webAppInfo.config.name}/nginx;
    location / {
        try_files $uri $uri/ =404;
    }
}
`), `${nginxDir}/nginx.conf`);

        await this.startFullStackedNginxOnRemoteHost();
        console.log("Uploaded nginx setup");

        const command = [
            "docker run --rm --name certbot",
            `-v ${nginxDir}:/html`,
            `-v ${nginxDir}/certs:/etc/letsencrypt/archive`,
            `certbot/certbot certonly --webroot --agree-tos --no-eff-email -n -m ${email} -w /html`,
            `--cert-name certbot`,
            domains.map(serverName => `-d ${serverName}`).join(" ")
        ];

        await this.execOnRemoteHost(command.join(" "));

        await this.execOnRemoteHost(`sudo chmod 777 ${nginxDir} -R`);

        console.log("Downloading certificates");

        const fullchainPath = `${nginxDir}/certs/certbot/fullchain1.pem`;
        let fullchain = "";
        const stream = new Writable({
            write: function(chunk, encoding, next) {
                fullchain += chunk.toString();
                next();
            }
        });
        await sftp.get(fullchainPath, stream);

        const privkeyPath = `${nginxDir}/certs/certbot/privkey1.pem`;
        let privkey = "";
        const stream2 = new Writable({
            write: function(chunk, encoding, next) {
                privkey += chunk.toString()
                next();
            }
        });
        await sftp.get(privkeyPath, stream2);

        await sftp.rmdir(nginxDir, true);

        console.log("Cleaning Up");
        if(tempNginxDirRenamed){
            await sftp.rename(`${this.credentialsSSH.directory}/${this.webAppInfo.config.name}/_nginx`, nginxDir);
        }

        console.log("Done");

        return {fullchain, privkey};
    }

    hasSavedConfigs(): {hasConfig: boolean, encrypted?: boolean}{
        if(!this.config.configFile) return { hasConfig: false };

        if(this.config.configFile && !fs.existsSync(this.config.configFile))
            throw Error(`Cannot locate FullStacked config file at [${this.config.configFile}]`);

        const content = fs.readFileSync(this.config.configFile).toString();
        return {
            hasConfig: true,
            encrypted: content.trim()[0] !== "{"
        }
    }

    /**
     *
     * Load saved configs
     *
     */
    loadConfigs(): boolean{
        if(!this.config.configFile || !fs.existsSync(this.config.configFile)) return false;

        const content = fs.readFileSync(this.config.configFile).toString();
        try{
            const {credentialsSSH, nginxConfigs, certificateSSL} = this.config.configPassword
                ? decryptDataWithPassword(content, this.config.configPassword)
                : JSON.parse(content);

            this.credentialsSSH = credentialsSSH;
            this.nginxConfigs = nginxConfigs;
            this.certificateSSL = certificateSSL;
            return true;
        }catch (e) {
            console.log("Failed to load config");
            return false;
        }

    }

    /**
     *
     * Save config to project
     *
     */
    async saveConfigs(password: string) {
        const configs = {
            credentialsSSH: this.credentialsSSH,
            nginxConfigs: this.nginxConfigs,
            certificateSSL: this.certificateSSL
        }

        const configFile = this.config.configFile || resolve(process.cwd(), ".fullstacked");

        fs.writeFileSync(configFile, password
            ? encryptDataWithPassword(configs, password)
            : JSON.stringify(configs, null, 2));
    }

    downloadWithProgress(remoteFilePath: string, localFilePath: string){
        const dlStream = fs.createWriteStream(localFilePath);

        return new Promise<void>(async resolve => {
            const sftp = await this.getSFTP();

            let readStream = sftp.createReadStream(remoteFilePath, { autoClose: true });
            readStream.once('end', () => {
                dlStream.close(() => {
                    this.endLine();
                    resolve();
                });
            });

            const fileStat = await sftp.stat(remoteFilePath);

            const progressStream = progress({length: fileStat.size});

            progressStream.on('progress', progress => {
                this.printLine("Download progress : " + progress.percentage.toFixed(2) + "%");
            });

            readStream.pipe(progressStream).pipe(dlStream);
        })

    }

    async run() {
        if(!fs.existsSync(this.config.outputDir))
            throw Error(`Could not find bundled Web App directory at [${this.config.outputDir}]`);

        if(!fs.existsSync(resolve(this.config.outputDir, "docker-compose.yml")))
            throw Error(`Could not find docker-compose.yml file in Web App directory at [${this.config.outputDir}]`);

        let serverSSH: ServerSSH;
        if(this.config.dryRun){
            serverSSH = new ServerSSH();
            const { portSSH, username, password } = await serverSSH.init();
            this.credentialsSSH = {
                host: "0.0.0.0",
                port: portSSH,
                username: username,
                password: password,
                directory: "/home"
            };
        }

        await this.testRemoteServer();
        console.log("Connected to Remote Host");

        await this.testDockerOnRemoteHost();

        const { nginxFiles, dockerCompose } = await this.setupDockerComposeAndNginx();
        console.log("Docker Compose and Nginx are setup");

        await this.uploadFilesToRemoteServer(nginxFiles, dockerCompose);
        console.log("Web App is uploaded to the remote server");

        await this.startAppOnRemoteServer();
        await this.startFullStackedNginxOnRemoteHost();
        console.log("Web App Deployed");

        console.log("Deployment Successful");

        if(!this.config.dryRun)
            return (await this.getSFTP()).end();

        console.log(`Deployed Web App accessible at http://localhost:${serverSSH.container.portHTTP}`);

        let onlyOnce = false;
        process.on("SIGINT", async () => {
            if(onlyOnce) return;
            onlyOnce = true;
            console.log("Removing FullStacked Server SSH");
            await Promise.all([
                serverSSH.stop(),
                (await this.getSFTP()).end()
            ]);
            process.exit(0);
        });
    }

    async tryToLoadLocalConfigCLI(){
        const defaultConfigFile = resolve(process.cwd(), ".fullstacked");

        if(!this.config.configFile && fs.existsSync(defaultConfigFile)){
            const { useFoundConfigFile } = this.config.configPassword
                ? {useFoundConfigFile: true}
                : await prompts({
                    type: "confirm",
                    name: "useFoundConfigFile",
                    message: "We detected a saved config file (./.fullstacked). Would you like to use it?"
                });

            if(useFoundConfigFile){
                this.config = {
                    ...this.config,
                    configFile: defaultConfigFile
                }
            }
        }

        const checkConfigFile = this.hasSavedConfigs();

        if(checkConfigFile.hasConfig && checkConfigFile.encrypted && !this.config.configPassword){
            const { configPassword } = await prompts({
                type: "password",
                name: "configPassword",
                message: "Enter config file password"
            })

            this.config = {
                ...this.config,
                configPassword
            }
        }

        if(this.config.configFile)
            return this.loadConfigs();
    }

    async runCLI() {
        this.askToInstallDockerOnRemoteHost = async function(){
            const { install } = await prompts({
                type: "confirm",
                name: "install",
                message: "Would you like FullStacked try to install Docker on your remote host?"
            });

            return install;
        }

        if(!this.config.dryRun) {
            if (!await this.tryToLoadLocalConfigCLI()) {
                await this.setupCredentialsWithConfigAndPrompts();
                await this.setupNginxConfigsWithPrompts();
                await this.setupCertificatesWithPrompts();
            }
        }

        await this.run();

        if(this.config.configFile) return;

        const { save } = await prompts({
            type: "confirm",
            name: "save",
            message: "Would you like to save the configuration used?"
        });

        if(!save) return;

        const { password } = await prompts({
            type: "password",
            name: "password",
            message: "Encrypt saved config with password (leave blank for unencrypted)"
        });

        await this.saveConfigs(password);
    }
}
