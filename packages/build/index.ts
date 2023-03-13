import path, { resolve } from "path";
import esbuild, {Format, Loader, Platform} from "esbuild";
import fs from "fs";
import yaml from "js-yaml";
import CommandInterface from "fullstacked/CommandInterface";
import {globSync} from "glob";
import CLIParser from "fullstacked/utils/CLIParser";
import {fileURLToPath} from "url";
import * as process from "process";
import Info from "fullstacked/info";

export default class Build extends CommandInterface {
    static entryPoint = fileURLToPath(new URL("./entrypoint.ts", import.meta.url));
    static fullstackedNodeDockerComposeSpec = {
        services: {
            node: {
                image: "node:18-alpine",
                working_dir: "/app",
                command: ["index.mjs"],
                restart: "unless-stopped",
                expose: ["80"],
                ports: ["80"],
                volumes: [`./app:/app`]
            }
        }
    };

    static commandLineArguments = {
        client: {
            type: "string[]",
            short: "c",
            default: [
                "./client/index.ts",
                "./client/index.tsx",
                ...globSync("./client/**/*.client.ts"),
                ...globSync("./client/**/*.client.tsx")
            ].filter((defaultFiles) => fs.existsSync(defaultFiles)),
            description: "Client entry points to be bundled",
            defaultDescription: "./client/index.ts(x), ./client/*.client.ts(x)"
        },
        server: {
            type: "string[]",
            short: "s",
            default: [
                "./server/index.ts",
                "./server/index.tsx",
                ...globSync("./server/**/*.server.ts"),
                ...globSync("./server/**/*.server.tsx")
            ].filter((defaultFiles) => fs.existsSync(defaultFiles)),
            description: "Server entry points to be bundled",
            defaultDescription: "./server/index.ts(x), ./server/*.server.ts(x)"
        },
        dockerCompose: {
            type: "string[]",
            short: "d",
            default: [
                "./docker/compose.yml",
                ...globSync("./docker/**/*.compose.yml")
            ].filter((defaultFiles) => fs.existsSync(defaultFiles)),
            description: "Docker Compose files to be bundled",
            defaultDescription: "./docker/compose.yml, ./docker/*.compose.yml"
        },
        outputDir: {
            type: "string",
            short: "o",
            default: "./dist",
            description: "Output directory where all the bundled files will be",
            defaultDescription: "./dist"
        },
        production: {
            type: "boolean",
            description: "Build in production mode",
            defaultDescription: "false"
        },
        externalModules: {
            type: "string[]",
            description: "Ignore modules when building.\nYou can also define them at .externalModules in your package.json"
        },
        verbose: {
            type: "boolean",
            short: "v",
            defaultDescription: "false",
            description: "Output the list of files bundled"
        }
    } as const;
    config = CLIParser.getCommandLineArgumentsValues(Build.commandLineArguments);

    externalModules: string[] = [];

    constructor() {
        super();

        if(this.config.externalModules)
            this.externalModules.push(...this.config.externalModules)

        if(Info.packageJsonData.externalModules)
            this.externalModules.push(...Info.packageJsonData.externalModules)
    }


    // get all env variables in the form of an object
    getProcessEnv() {
        let processEnv = {};
        Object.keys(process.env).forEach((envKey) => {
            if (envKey.includes("(") || envKey.includes(")") || envKey.includes("-") || envKey.includes("%"))
                return;
            processEnv["process.env." + envKey] = "'" + escape(process.env[envKey].trim()) + "'";
        });
        return processEnv;
    }

    async buildServer() {
        const serverOutDir = resolve(this.config.outputDir, "app");

        const serverFiles = this.config.server.map(file => resolve(file));

        // use @fullstacked/webapp as default if installed
        const fullstackedWebAppServerStartFile = new URL("../webapp/server/start.js", import.meta.url);

        const filesBuilt = new Set();

        const options = {
            entryPoints: [Build.entryPoint],
            outfile: resolve(serverOutDir, "index.mjs"),
            platform: "node" as Platform,
            bundle: true,
            format: "esm" as Format,
            sourcemap: true,
            external: this.externalModules ?? [],
            define: this.getProcessEnv(),

            // source: https://github.com/evanw/esbuild/issues/1921#issuecomment-1166291751
            banner: { js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);" },

            plugins: [{
                name: "fullstacked-bundled-server",
                setup(build) {
                    build.onLoad({ filter: /.*/ }, (args) => {
                        if (!args.path.includes("node_modules"))
                            filesBuilt.add(args.path);

                        if (args.path !== Build.entryPoint)
                            return null;

                        if(fs.existsSync(fullstackedWebAppServerStartFile))
                            serverFiles.push(fileURLToPath(fullstackedWebAppServerStartFile));

                        const contents = serverFiles.map((file) => `import("${file.split(path.sep).join("/")}");`).join("\n");

                        return {
                            contents,
                            loader: "ts"
                        };
                    });
                }
            }]
        };

        const result = await esbuild.build(options);

        if (result.errors.length > 0)
            return;

        console.log("\x1B[32m%s\x1B[0m", "Server Built");

        return filesBuilt;
    }


    async buildClient() {
        const clientOutDir = resolve(this.config.outputDir, "app", "public");

        const filesBuilt = new Set();

        const clientFiles = this.config.client.map(file => resolve(file));

        const options = {
            entryPoints: [Build.entryPoint],
            outdir: clientOutDir,
            entryNames: "index",
            format: "esm" as Format,
            splitting: true,
            bundle: true,
            minify: Boolean(this.config.production),
            sourcemap: !Boolean(this.config.production),
            external: this.externalModules ?? [],
            define: this.getProcessEnv(),
            loader: {
                ".png"  : "file" as Loader,
                ".jpg"  : "file" as Loader,
                ".svg"  : "file" as Loader,
                ".md"   : "file" as Loader,
                ".ttf"  : "file" as Loader,
                ".woff" : "file" as Loader,
                ".woff2": "file" as Loader
            },

            plugins: [{
                name: "fullstacked-bundled-client",
                setup(build) {
                    build.onLoad({ filter: /.*/ }, (args) => {
                        if (!args.path.includes("node_modules"))
                            filesBuilt.add(args.path);

                        if (args.path !== Build.entryPoint)
                            return null;

                        const contents = clientFiles.map((file) => `import "${file.split(path.sep).join("/")}";`).join("\n");

                        return {
                            contents,
                            loader: "ts"
                        };
                    });
                }
            }]
        };

        const result = await esbuild.build(options);

        if (result.errors.length > 0)
            return;

        console.log("\x1B[32m%s\x1B[0m", "Client Built");

        return filesBuilt;
    }

    mergeDockerComposeSpecs(dockerComposeSpecs) {
        const dockerCompose = {};
        const dockerComposeRootAttributes = [
            "services",
            "volumes",
            "networks"
        ];
        dockerComposeSpecs.forEach((dockerComposeSpec) => {
            dockerComposeRootAttributes.forEach((attribute) => {
                dockerCompose[attribute] = {
                    ...dockerCompose[attribute],
                    ...dockerComposeSpec[attribute]
                };
            });
        });
        return dockerCompose;
    }

    async buildDockerCompose() {
        const nodeDockerComposeSpec = structuredClone(Build.fullstackedNodeDockerComposeSpec);
        if (!this.config.production) {
            nodeDockerComposeSpec.services.node.command.unshift("--enable-source-maps");
            nodeDockerComposeSpec.services.node.command.push("--development");
        }
        const dockerComposeSpecs = [nodeDockerComposeSpec].concat(this.config.dockerCompose.map((dockerComposeFile) => yaml.load(fs.readFileSync(dockerComposeFile).toString())));
        const mergedDockerCompose = this.mergeDockerComposeSpecs(dockerComposeSpecs);
        fs.writeFileSync(resolve(this.config.outputDir, "docker-compose.yml"), yaml.dump(mergedDockerCompose));
        return new Set(this.config.dockerCompose);
    }

    async run() {
        if (fs.existsSync(this.config.outputDir))
            fs.rmSync(this.config.outputDir, {recursive: true});

        fs.mkdirSync(this.config.outputDir);

        const files = await Promise.all([
            this.buildServer(),
            this.buildClient(),
            this.buildDockerCompose()
        ]);

        if (this.config.verbose)
            console.log(Array.from(/* @__PURE__ */ new Set([...files[0], ...files[1], ...files[2]])).join("\n"));
    }

    runCLI() {
        return this.run();
    }
}
