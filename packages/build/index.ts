import { resolve } from "path";
import esbuild, {Format, Platform} from "esbuild";
import fs from "fs";
import yaml from "js-yaml";
import CommandInterface from "fullstacked/CommandInterface";
import glob from "fast-glob";
import CLIParser from "fullstacked/utils/CLIParser";
import Info from "fullstacked/info";

// Polyfill for stackblitz
if(!global.structuredClone) {
    global.structuredClone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

const dynamicLoaderPlugin = {
    name: "dynamic-loader",
    setup(build) {
        build.onLoad({ filter: /.*/ }, ({path}) => {
            return {
                contents: fs.readFileSync(path),
                loader: path.endsWith(".ts")
                    ? "ts"
                    : path.endsWith(".tsx")
                        ? "tsx"
                        : path.endsWith(".jsx")
                            ? "jsx"
                            : path.endsWith("js") // .js, .mjs, .cjs
                                ? "js"
                                : path.endsWith(".css")
                                    ? "css"
                                    : path.endsWith(".json")
                                        ? "json"
                                        : "file"
            };
        });
    }
}

export default class Build extends CommandInterface {
    static fullstackedNodeDockerComposeSpec = {
        services: {
            node: {
                image: "node:18-alpine",
                working_dir: "/app",
                command: [
                    "sh",
                    "-c",
                    "node server/index.mjs"
                ],
                restart: "unless-stopped",
                expose: ["8000"],
                ports: ["8000"],
                volumes: [
                    `./client:/app/client`,
                    `./server:/app/server`
                ],
                environment: [
                    "NODE_ENV=development"
                ]
            }
        }
    };

    static commandLineArguments = {
        client: {
            type: "string",
            short: "c",
            default: [
                "./client/index.ts",
                "./client/index.tsx",
                "./client/index.js",
                "./client/index.jsx",
            ].find((defaultFile) => fs.existsSync(defaultFile)),
            description: "Client entry point",
            defaultDescription: "./client/index.ts(x)"
        },
        server: {
            type: "string",
            short: "s",
            default: [
                "./server/index.ts",
                "./server/index.tsx",
                "./server/index.js",
                "./server/index.jsx",
            ].find((defaultFile) => fs.existsSync(defaultFile)),
            description: "Server entry point",
            defaultDescription: "./server/index.ts(x)"
        },
        dockerCompose: {
            type: "string[]",
            short: "d",
            default: [
                "./docker/compose.yml",
                ...glob.sync("./docker/**/*.compose.yml")
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
        let processEnv = {
            'process.env.APP_NAME': JSON.stringify(Info.webAppName),
            'process.env.VERSION': JSON.stringify(Info.version),
            'process.env.HASH': JSON.stringify(Info.hash)
        };
        Object.keys(process.env).forEach((envKey) => {
            if (envKey.includes("(") || envKey.includes(")") || envKey.includes("-") || envKey.includes("%"))
                return;
            processEnv["process.env." + envKey] = "'" + escape(process.env[envKey].trim()) + "'";
        });
        return processEnv;
    }

    async buildServer() {
        if(!fs.existsSync(this.config.server)) return;

        const serverOutDir = resolve(this.config.outputDir, "server");

        const options = {
            entryPoints: [this.config.server],
            outfile: resolve(serverOutDir, "index.mjs"),
            platform: "node" as Platform,
            bundle: true,
            format: "esm" as Format,
            sourcemap: true,
            publicPath: "server",
            external: this.externalModules ?? [],
            define: this.getProcessEnv(),

            // source: https://github.com/evanw/esbuild/issues/1921#issuecomment-1166291751
            banner: { js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);" },

            plugins: [dynamicLoaderPlugin]
        };

        const result = await esbuild.build(options);

        if (result.errors.length > 0)
            return;

        console.log("\x1B[32m%s\x1B[0m", "Server Built");
    }


    async buildClient() {
        if(!fs.existsSync(this.config.client)) return;

        const clientOutDir = resolve(this.config.outputDir, "client");

        const options = {
            entryPoints: [this.config.client],
            outdir: clientOutDir,
            entryNames: "index",
            format: "esm" as Format,
            splitting: true,
            bundle: true,
            minify: Boolean(this.config.production),
            sourcemap: !Boolean(this.config.production),
            external: this.externalModules ?? [],
            define: this.getProcessEnv(),
            plugins: [dynamicLoaderPlugin]
        };

        const result = await esbuild.build(options);

        if (result.errors.length > 0)
            return;

        console.log("\x1B[32m%s\x1B[0m", "Client Built");
    }

    mergeDockerComposeSpecs(dockerComposeSpecs) {
        const dockerCompose: any = {};
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
        const dockerComposeSpecs = this.config.dockerCompose.map((dockerComposeFile) => yaml.load(fs.readFileSync(dockerComposeFile).toString()));

        if(fs.existsSync(this.config.server) && Build.fullstackedNodeDockerComposeSpec){
            const nodeDockerComposeSpec: any = structuredClone(Build.fullstackedNodeDockerComposeSpec);
            if (!this.config.production) {
                nodeDockerComposeSpec.services.node.command = [
                    "sh",
                    "-c",
                    "node --enable-source-maps server/index.mjs"
                ];
            }else{
                nodeDockerComposeSpec.services.node.environment = [
                    "NODE_ENV=production"
                ];
            }
            dockerComposeSpecs.push(nodeDockerComposeSpec);
        }

        if(!dockerComposeSpecs.length) return;

        const mergedDockerCompose = this.mergeDockerComposeSpecs(dockerComposeSpecs);

        if(!fs.existsSync(this.config.outputDir))
            fs.mkdirSync(this.config.outputDir, {recursive: true});

        fs.writeFileSync(resolve(this.config.outputDir, "docker-compose.yml"), yaml.dump(mergedDockerCompose));
        return new Set(this.config.dockerCompose);
    }

    async run() {
        if (fs.existsSync(this.config.outputDir)) {
            try{
                fs.rmSync(this.config.outputDir, {recursive: true, force: true});
            }catch (e) {
                console.log("Could not fully clear out directory... Proceeding...");
            }
        }

        fs.mkdirSync(this.config.outputDir);


        await Promise.all([
            this.buildServer(),
            this.buildClient(),
            this.buildDockerCompose()
        ]);
    }

    runCLI() {
        return this.run();
    }
}
