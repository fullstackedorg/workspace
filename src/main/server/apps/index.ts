import Server, { Listener } from "@fullstacked/webapp/server";
import { BackendTool, WebSocketRegisterer } from "../backend";
import { Sync } from "../sync/sync";
import { normalizePath } from "../sync/utils";
import fs from "fs";
import path from "path";
import mime from "mime";

export default class extends BackendTool {
    api = {
        async runApp(entrypoint: string){
            const server = (await import(path.join(Sync.config.directory, entrypoint))).default as Server;
            return `http://localhost:${server.port}`;
        },
        listApps(){
            return findAllPackageJSON(Sync.config.directory)
                .map(packageJSONPath => ({
                    directory: packageJSONPath.slice(Sync.config.directory.length + 1, - "/package.json".length),
                    packageJSON: JSON.parse(fs.readFileSync(packageJSONPath).toString())
                }))
                .filter(app => app.packageJSON.main)
                .map(({directory, packageJSON}) => ({
                    title: packageJSON.title || packageJSON.name,
                    icon: packageJSON.icon ? "/" + normalizePath(path.join("app-icon", directory, packageJSON.icon)) : undefined,
                    entrypoint: normalizePath(path.join(directory, packageJSON.main))
                }));
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

function findAllPackageJSON(dir: string, packageJSONs: string[] = []){
    const items = fs.readdirSync(dir, {withFileTypes: true});
    items.forEach(item => {
        const itemPath = path.join(item.path, item.name)
        if(item.isDirectory() && item.name !== "node_modules" && item.name !== "code-oss")
            findAllPackageJSON(itemPath, packageJSONs);
        else if(item.name === "package.json")
            packageJSONs.push(normalizePath(itemPath));
    })
    return packageJSONs;
}