import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {bundleCSSFiles, getModulePathExtension} from "./builder";
import WebSocket, {WebSocketServer} from "ws";
import fs from "fs";
import {getModulePathWithT, invalidateModule, moduleExtensions} from "./utils";
import type {Socket} from "net";

if(process.env.DOCKER)
    execSync("npm i esbuild-linux-64 --no-save", {stdio: "inherit"});

const clientWatcherScript = fs.readFileSync(new URL("./client.js", import.meta.url));
const Builder = (await import("./builder")).default;

const modulePathToSafeJS = (modulePath: string) => {
    const realModulePath = modulePath + getModulePathExtension(modulePath);
    const splitAtDot = realModulePath.split(".");
    splitAtDot.pop();
    return splitAtDot.join(".") + ".js";
}

export default async function(clientEntrypoint: string, serverEntrypoint: string) {
    const clientBaseDir = dirname(clientEntrypoint);
    const clientBuild = await Builder({
        entrypoint: clientEntrypoint,
        recurse: true,
        moduleResolverWrapperFunction: "getModuleImportPath",
        externalModules: {
            convert: true,
            bundle: true
        }
    });

    const serverBuild = await Builder({
        entrypoint: serverEntrypoint,
        recurse: true,
        moduleResolverWrapperFunction: "getModuleImportPath",
        externalModules: {
            convert: false,
        }
    });

    const wss = new WebSocketServer({ noServer: true });
    const activeWS = new Set<WebSocket>();
    wss.on('connection', (ws) => {
        activeWS.add(ws)
        console.log(`Received Connection. Currently [${activeWS.size}] active conn.`);

        ws.on('close', () => {
            activeWS.delete(ws);
            console.log(`Lost Connection. Currently [${activeWS.size}] active conn.`);
        });

        ws.send(JSON.stringify({
            type: "setup",
            data: {
                tree: clientBuild.modulesFlatTree,
                basePath: clientBaseDir,
                assetsPath: "/assets",
                entrypoint: clientEntrypoint + getModulePathExtension(clientEntrypoint)
            }
        }));
    });

    const server = (await import(resolve("./dist", modulePathToSafeJS(serverEntrypoint)) + `?t=${Date.now()}`)).default;

    server.prependListener('request', (_, res) => {
        const originalEnd = res.end.bind(res);
        res.end = function(chunk, encoding, callback) {

            const mimeType = res.getHeader("Content-Type");

            if (mimeType === 'text/html') {
                res.write(chunk, encoding);
                res.write(`<script>${clientWatcherScript}</script>`);
                return originalEnd(undefined, undefined, callback);
            }

            originalEnd(chunk, encoding, callback);
        }
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    Object.keys(clientBuild.modulesFlatTree).forEach(modulePath => {
        fs.watch(modulePath, async (eventType, filename) => {

            if (!moduleExtensions.find(ext => modulePath.endsWith(ext))) {

                if (modulePath.endsWith(".css")) {
                    await bundleCSSFiles(clientBuild.cssFiles, resolve("dist", clientBaseDir), "index.css");

                    activeWS.forEach(ws => ws.send(JSON.stringify({
                        type: "css",
                        data: "index.css"
                    })));

                    return;
                }

                return;
            }

            try {
                await Builder({
                    entrypoint: modulePath,
                    recurse: false,
                    moduleResolverWrapperFunction: "getModuleImportPath",
                    externalModules: {
                        convert: true,
                        bundle: false
                    }
                });
            } catch (e) {
                activeWS.forEach(ws => ws.send(JSON.stringify({
                    type: "error",
                    data: e.errors
                })));
                return;
            }

            activeWS.forEach(ws => ws.send(JSON.stringify({
                type: "module",
                data: modulePath
            })));
        });
    });


    global.getModuleImportPath = (modulePath, currentModulePath) => {
        const fixedModulePath = resolve(dirname((new URL(currentModulePath)).pathname), modulePath)
            .replace(process.cwd(), ".")
            .replace("/dist", "");
        return getModulePathWithT(fixedModulePath, serverBuild.modulesFlatTree);
    };

    let reloadThrottler;
    const reloadServer = () => {
        if(reloadThrottler) clearTimeout(reloadThrottler);
        reloadThrottler = setTimeout(async () => {
            reloadThrottler = null;
            await import(resolve("./dist", modulePathToSafeJS(serverEntrypoint)) + `?t=${Date.now()}`)
            activeWS.forEach(ws => ws.send(JSON.stringify({
                type: "server"
            })));
        }, 100);
    }

    Object.keys(serverBuild.modulesFlatTree).forEach(modulePath => {
        fs.watch(modulePath, async () => {

            try {
                await Builder({
                    entrypoint: modulePath,
                    recurse: false,
                    moduleResolverWrapperFunction: "getModuleImportPath",
                    externalModules: {
                        convert: false,
                    }
                });
            } catch (e) {
                activeWS.forEach(ws => ws.send(JSON.stringify({
                    type: "error",
                    data: e.errors
                })));
                return;
            }

            serverBuild.modulesFlatTree = invalidateModule(modulePath, serverBuild.modulesFlatTree);

            reloadServer();
        });
    });
}
