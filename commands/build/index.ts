var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
};

// commands/build/index.ts
import { dirname, resolve } from "path";
import esbuild from "esbuild";
import fs from "fs";
import yaml from "js-yaml";
import CommandInterface from "fullstacked/commands/CommandInterface";
import glob from "glob";
import HTML from "./HTML.js";
import CLIParser from "fullstacked/utils/CLIParser";
import { fileURLToPath } from "url";
var __dirname = dirname(fileURLToPath(import.meta.url));
var _Build = class extends CommandInterface {
    config = CLIParser.getCommandLineArgumentsValues(_Build.commandLineArguments);
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
        const serverFiles = this.config.server;
        const filesBuilt = /* @__PURE__ */ new Set();
        const options = {
            entryPoints: [_Build.fullstackedServer],
            outfile: resolve(serverOutDir, "index.mjs"),
            platform: "node",
            bundle: true,
            format: "esm",
            external: this.config.externalModules ?? [],
            define: this.getProcessEnv(),
            // source: https://github.com/evanw/esbuild/issues/1921#issuecomment-1166291751
            banner: { js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);" },
            plugins: [{
                name: "fullstacked-bundled-server",
                setup(build) {
                    build.onResolve({ filter: /fullstacked\/server/ }, (args) => {
                        return {
                            path: _Build.fullstackedServer
                        };
                    });
                    build.onLoad({ filter: /.*/ }, (args) => {
                        if (!args.path.includes("node_modules"))
                            filesBuilt.add(args.path);
                        if (args.path !== _Build.fullstackedServer)
                            return null;
                        const contents = fs.readFileSync(_Build.fullstackedServer) + "\n" + serverFiles.map((file) => `import("${file.replace(/\\/g, "\\\\")}");`).join("\n");
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
        const filesBuilt = /* @__PURE__ */ new Set();
        const clientFiles = this.config.client;
        const options = {
            entryPoints: [_Build.fullstackedClient],
            outdir: clientOutDir,
            entryNames: "index",
            format: "esm",
            splitting: true,
            bundle: true,
            minify: Boolean(this.config.production),
            sourcemap: !Boolean(this.config.production),
            external: this.config.externalModules ?? [],
            define: this.getProcessEnv(),
            loader: {
                ".png": "file",
                ".jpg": "file",
                ".svg": "file",
                ".md": "file",
                ".ttf": "file"
            },
            plugins: [{
                name: "fullstacked-bundled-client",
                setup(build) {
                    build.onStart(() => {
                        if (fs.existsSync(clientOutDir))
                            fs.rmSync(clientOutDir, { force: true, recursive: true });
                    });
                    build.onLoad({ filter: /.*/ }, (args) => {
                        if (!args.path.includes("node_modules"))
                            filesBuilt.add(args.path);
                        if (!args.path.match(new RegExp(_Build.fullstackedClient.replace(/\\/g, "\\\\"))))
                            return;
                        const contents = fs.readFileSync(_Build.fullstackedClient) + "\n" + clientFiles.map((file) => `import "${file.replace(/\\/g, "\\\\")}";`).join("\n");
                        return {
                            contents,
                            loader: "ts"
                        };
                    });
                }
            }]
        };
        const result = await esbuild.build(options);
        const html = new HTML();
        html.addInBODY(`<script type="module" src="/index.js"></script>`);
        glob.sync("*.css", { cwd: clientOutDir }).forEach((cssFile) => html.addInHead(`<link rel="stylesheet" href="/${cssFile}">`));
        fs.writeFileSync(resolve(clientOutDir, "index.html"), html.toString());
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
        const nodeDockerComposeSpec = structuredClone(_Build.fullstackedNodeDockerComposeSpec);
        if (!this.config.production) {
            nodeDockerComposeSpec.services.node.command.push("--development");
        }
        const dockerComposeSpecs = [nodeDockerComposeSpec].concat(this.config.dockerCompose.map((dockerComposeFile) => yaml.load(fs.readFileSync(dockerComposeFile).toString())));
        const mergedDockerCompose = this.mergeDockerComposeSpecs(dockerComposeSpecs);
        fs.writeFileSync(resolve(this.config.outputDir, "docker-compose.yml"), yaml.dump(mergedDockerCompose));
        return new Set(this.config.dockerCompose);
    }
    async run() {
        if (!fs.existsSync(this.config.outputDir))
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
    guiCommands() {
        return [];
    }
};
var Build = _Build;
__publicField(Build, "commandLineArguments", {
    client: {
        type: "string[]",
        short: "c",
        default: [resolve(process.cwd(), "client", "index.ts"), resolve(process.cwd(), "client", "index.tsx")].concat(glob.sync(resolve(process.cwd(), "client", "**", "*.client.ts"))).concat(glob.sync(resolve(process.cwd(), "client", "**", "*.client.tsx"))).filter((defaultFiles) => fs.existsSync(defaultFiles)),
        description: "Client entry points to be bundled",
        defaultDescription: "./client/index.ts(x), ./client/*.client.ts(x)"
    },
    server: {
        type: "string[]",
        short: "s",
        default: [resolve(process.cwd(), "server", "index.ts")].concat(glob.sync(resolve(process.cwd(), "server", "**", "*.server.ts"))).filter((defaultFiles) => fs.existsSync(defaultFiles)),
        description: "Server entry points to be bundled",
        defaultDescription: "./server/index.ts, ./server/*.server.ts"
    },
    dockerCompose: {
        type: "string[]",
        short: "d",
        default: [resolve(process.cwd(), "docker-compose.yml")].concat(glob.sync(resolve(process.cwd(), "**", "*.docker-compose.yml"))).filter((defaultFiles) => fs.existsSync(defaultFiles)),
        description: "Docker Compose files to be bundled",
        defaultDescription: "./docker-compose.yml, ./*.docker-compose.yml"
    },
    outputDir: {
        type: "string",
        short: "o",
        default: resolve(process.cwd(), "dist"),
        description: "Output directory where all the bundled files will be",
        defaultDescription: "./dist"
    },
    production: {
        type: "boolean",
        short: "p",
        description: "Build in production mode",
        defaultDescription: "false"
    },
    externalModules: {
        type: "string[]",
        description: "Ignore modules when building"
    },
    verbose: {
        type: "boolean",
        short: "v",
        defaultDescription: "false",
        description: "Output the list of files bundled"
    }
});
__publicField(Build, "fullstackedServer", resolve(__dirname, "..", "..", "server", "index.ts"));
__publicField(Build, "fullstackedClient", resolve(__dirname, "..", "..", "client", "index.ts"));
__publicField(Build, "fullstackedNodeDockerComposeSpec", {
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
});
export {
    Build as default
};
//# sourceMappingURL=index.js.map
