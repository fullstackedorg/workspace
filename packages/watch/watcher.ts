import {execSync} from "child_process";
import {dirname, resolve} from "path";
import {bundleCSSFiles, getModulePathExtension} from "./builder";
import WebSocket, {WebSocketServer} from "ws";
import fs, {FSWatcher} from "fs";
import {getModulePathWithT, invalidateModule, moduleExtensions} from "./utils";
import {Socket} from "net";
import {pathToFileURL} from "url";

if(process.env.DOCKER)
    execSync("npm i esbuild-linux-64 --no-save", {stdio: "inherit"});

const clientWatcherScript = fs.readFileSync(new URL("./client.js", import.meta.url));
const Builder = (await import("./builder")).default;

function isEqualSets(xs, ys) {
    return xs.size === ys.size && [...xs].every((x) => ys.has(x));
}

function modulePathToSafeJS(modulePath: string) {
    const realModulePath = modulePath + getModulePathExtension(modulePath);
    const splitAtDot = realModulePath.split(".");
    splitAtDot.pop();
    return splitAtDot.join(".") + ".js";
}

export default async function(clientEntrypoint: string, serverEntrypoint: string, outdir: string) {
    const clientBaseDir = dirname(clientEntrypoint);
    let clientBuild: Awaited<ReturnType<typeof Builder>>;
    const reloadClientBuild = async () => {
        clientBuild = await Builder({
            entrypoint: clientEntrypoint,
            outdir,
            recurse: true,
            moduleResolverWrapperFunction: "getModuleImportPath",
            externalModules: {
                convert: true,
                bundle: true
            }
        });
    }
    await reloadClientBuild();

    let serverBuild: Awaited<ReturnType<typeof Builder>>;
    const reloadServerBuild = async () => {
        serverBuild = await Builder({
            entrypoint: serverEntrypoint,
            outdir,
            recurse: true,
            moduleResolverWrapperFunction: "getModuleImportPath",
            externalModules: {
                convert: false,
            }
        });
    }
    await reloadServerBuild();


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
                entrypoint: clientEntrypoint + getModulePathExtension(clientEntrypoint)
            }
        }));
    });

    let server, activeSockets = new Set<Socket>();
    const loadServer = async () => {
        const closeServer = () => {
            activeWS.forEach((ws) => {
                ws.send(JSON.stringify({
                    type: "server"
                }));
                activeWS.delete(ws);
            });

            return new Promise(resolve => {
                activeSockets.forEach(socket => socket.destroy());
                server.close(resolve);
            });
        }
        if(server){
            await closeServer();
        }

        try{
            const fileURL = pathToFileURL(resolve(outdir, modulePathToSafeJS(serverEntrypoint)));
            server = (await import(fileURL.toString() + `?t=${Date.now()}`)).default;
        }catch (e) {
            console.error(e);
            await closeServer();
            return;
        }


        server.prependListener('request', (_, res) => {
            const originalEnd = res.end.bind(res);
            res.end = function(chunk, encoding, callback) {

                const mimeType = res.getHeader("Content-Type");

                if (mimeType === 'text/html') {
                    if(chunk) res.write(chunk, encoding);
                    res.write(`<script>${clientWatcherScript}</script>`);
                    return originalEnd(undefined, undefined, callback);
                }

                originalEnd(chunk, encoding, callback);
            }
        });

        server.on('upgrade', (request, socket, head) => {
            if(request.url !== "/fullstacked-watch") return;

            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        });

        server.on('connection', function(socket) {
            activeSockets.add(socket)

            socket.on('close', function() {
                activeSockets.delete(socket)
            });
        });
    }


    const initClientWatch = (modulePath) => fs.watch(modulePath, async (eventType, filename) => {

        if (!moduleExtensions.find(ext => modulePath.endsWith(ext))) {

            if (modulePath.endsWith(".css")) {
                await bundleCSSFiles(clientBuild.cssFiles, resolve("dist", clientBaseDir), "index.css");

                activeWS.forEach(ws => ws.send(JSON.stringify({
                    type: "css",
                    data: "index.css"
                })));

                return;
            }

            fs.copyFileSync(modulePath, clientBuild.modulesFlatTree[modulePath].out)

            activeWS.forEach(ws => ws.send(JSON.stringify({
                type: "asset",
                data: modulePath
            })));

            if (!fs.existsSync(filename)) {
                clientWatchers.get(modulePath).close();
                clientWatchers.set(modulePath, initClientWatch(modulePath));
            }

            return;
        }

        let fileBuild: Awaited<ReturnType<typeof Builder>>;
        try {
            fileBuild = await Builder({
                entrypoint: modulePath,
                recurse: false,
                moduleResolverWrapperFunction: "getModuleImportPath",
                externalModules: {
                    convert: true,
                    bundle: false
                }
            }, clientBuild.externalModules);
        } catch (e) {
            activeWS.forEach(ws => ws.send(JSON.stringify({
                type: "error",
                data: e.errors
            })));
            return;
        }

        if (!isEqualSets(fileBuild.modulesFlatTree[modulePath].imports, clientBuild.modulesFlatTree[modulePath].imports)) {
            await reloadClientBuild();

            clientWatchers.forEach(watcher => watcher.close());
            clientWatchers.clear();
            Object.keys(clientBuild.modulesFlatTree).forEach(modulePath => {
                clientWatchers.set(modulePath, initClientWatch(modulePath));
            });

            activeWS.forEach(ws => ws.send(JSON.stringify({
                type: "reload"
            })));
            return;
        }

        activeWS.forEach(ws => ws.send(JSON.stringify({
            type: "module",
            data: modulePath
        })));
    });

    const clientWatchers = new Map<string, FSWatcher>();
    Object.keys(clientBuild.modulesFlatTree).forEach(modulePath => {
        clientWatchers.set(modulePath, initClientWatch(modulePath));
    });

    global.getModuleImportPath = (modulePath) => {
        const modulePathWithT = getModulePathWithT(modulePath, serverBuild.modulesFlatTree);
        if(modulePathWithT.isAsset) return serverBuild.modulesFlatTree[modulePath].out;

        return resolve(process.cwd(), outdir, modulePathWithT.path);
    };

    let reloadThrottler;
    const reloadServer = () => {
        if(reloadThrottler) clearTimeout(reloadThrottler);
        reloadThrottler = setTimeout(async () => {
            reloadThrottler = null;
            await loadServer();
            activeWS.forEach(ws => ws.send(JSON.stringify({
                type: "server"
            })));
        }, 100);
    }

    await reloadServer();

    const initServerWatch = modulePath => fs.watch(modulePath, async () => {

        let fileBuild: Awaited<ReturnType<typeof Builder>>;
        try {
            fileBuild = await Builder({
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

        if (!isEqualSets(fileBuild.modulesFlatTree[modulePath].imports, serverBuild.modulesFlatTree[modulePath].imports)) {
            await reloadServerBuild();

            serverWatchers.forEach(watcher => watcher.close());
            serverWatchers.clear();
            Object.keys(serverBuild.modulesFlatTree).forEach(modulePath => {
                serverWatchers.set(modulePath, initServerWatch(modulePath));
            });
        }

        serverBuild.modulesFlatTree = invalidateModule(modulePath, serverBuild.modulesFlatTree);

        reloadServer();
    });

    const serverWatchers = new Map<string, FSWatcher>()
    Object.keys(serverBuild.modulesFlatTree).forEach(modulePath => {
        serverWatchers.set(modulePath, initServerWatch(modulePath));
    });
}
