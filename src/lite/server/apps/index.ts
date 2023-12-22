import Server, { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../../../main/server/backend";
import { Sync } from "../../../main/server/sync/sync";
import { normalizePath } from "../../../main/server/sync/utils";
import fs from "fs";
import path from "path";
import mime from "mime";
import { pathToFileURL } from "url";
import http2 from "http2";
import { SyncClient } from "../../../main/server/sync/client";
import { getLocalBaseDir } from "../../../main/server/sync/fs/cloud";
import { syncFileName } from "@fullstacked/sync/constants";

export default class extends BackendTool {
    api = {
        async runApp(entrypoint: string) {
            const server = (await import(pathToFileURL(path.join(Sync.config.directory, entrypoint)).toString())).default as Server;
            return `http://localhost:${server.port}`;
        },
        async listApps() {
            SyncClient.rsync.baseDir = getLocalBaseDir();
            if (Sync.config.authorization){
                SyncClient.rsync.headers.authorization = Sync.config.authorization;
                SyncClient.fs.headers.authorization = Sync.config.authorization;
            }

            const session = http2.connect(SyncClient.rsync.endpoint);
            session.on('error', (err) => {
                throw err;
            });

            const stream = session.request({
                ':path': '/packages',
                ':method': 'GET',
                ...SyncClient.rsync.headers
            });
            stream.end();
    
            stream.setEncoding('utf8')
            const packages: [string, number][] = await new Promise(resolve => {
                let data = '';
                stream.on('data', (chunk) => { data += chunk })
                stream.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });

            return (await Promise.all(packages.map(getAppInfosAndMaybePull))).filter(Boolean);
        }
    };
    listeners: (Listener & { prefix?: string; })[] = [{
        name: "App Icon",
        prefix: "/app-icon",
        handler(req, res) {
            const iconPath = Sync.config.directory + req.url;
            if (!fs.existsSync(iconPath)) {
                res.writeHead(404);
                res.end();
                return;
            }

            res.writeHead(200, {
                "content-type": mime.getType(iconPath),
                "content-length": fs.statSync(iconPath).size
            })

            const readStream = fs.createReadStream(iconPath);
            readStream.pipe(res);
        }
    }];
    websocket: WebSocketRegisterer;
}

async function getAppInfosAndMaybePull([packagePath, remoteVersion]){
    const packageJSON = JSON.parse((await SyncClient.fs.post().readFile(packagePath)).toString());
    
    const files = packageJSON.files;
    if(!files)
        return null;

    const pathComponents = packagePath.split("/").slice(0, -1);
    const directory = pathComponents.join("/");
    let version = null;
    while(pathComponents.length && !version){
        version = SyncClient.rsync.getSavedSnapshotAndVersion(directory)?.version;
        pathComponents.pop();
    }

    if(packageJSON.icon){
        fs.mkdirSync(path.resolve(SyncClient.rsync.baseDir, directory, path.dirname(packageJSON.icon)), {recursive: true});
        files.push(packageJSON.icon);
    }

    const title =  packageJSON.title || packageJSON.name;

    if (version !== remoteVersion) {
        const toSync = files.map(item => normalizePath(path.join(directory, item)));

        Sync.addSyncingKey(title, "pull");
        await Promise.all(toSync.map(item => SyncClient.rsync.pull(item, {
            force: true,
            progress(info) {
                Sync.updateSyncingKeyProgress(title, info)
            }
        })));
        fs.writeFileSync(path.resolve(SyncClient.rsync.baseDir, directory, syncFileName), JSON.stringify({version: remoteVersion}));
        Sync.removeSyncingKey(title);
    }

    return {
        title,
        
        icon: packageJSON.icon 
            // the /app-icon handler is used here
            ? "/" + normalizePath(path.join("app-icon", directory, packageJSON.icon)) 
            : undefined,

        entrypoint: packageJSON.main 
            ? normalizePath(path.join(directory, packageJSON.main))
            : undefined
    }
}