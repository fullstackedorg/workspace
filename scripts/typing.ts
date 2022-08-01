import fs from "fs";
import {sync} from "glob";
import path from "path";
import {randStr} from "./utils";
import getEndpoints from "express-list-endpoints";

export default function (config: Config, filesToLookup: Set<string>){
    if(!filesToLookup || !filesToLookup.size)
        return;

    const server = require(path.resolve(config.out, "index.js"));
    if(!server.default?.express)
        return;

    const registeredEndpoints = getEndpoints(server.default.express);

    const foundEndpoints = [];
    filesToLookup.forEach(file => {
        const content = fs.readFileSync(file, {encoding: "utf-8"});
        const matches = content.match(/\.(get|post|put|delete)<(.|\s)*?>\(.*?,/g);

        if(!matches)
            return;

        matches.forEach(match => {
            const methodMatch = match.match(/\.(get|post|put|delete)</g);
            if(!methodMatch)
                return;

            const method = methodMatch[0].slice(1,-1).trim();

            const typesMatch = match.match(/<(.|\s)*>/g);
            if(!typesMatch)
                return;


            const types = "[" + typesMatch[0].slice(1, -1).trim() + "]";

            const pathMatch = match.match(/\(.*?,/g);
            if(!pathMatch)
                return;

            const path = pathMatch[0].slice(1, -1).trim().replace(/(\"|\')/g, '');
            foundEndpoints.push({
                method: method,
                types: types,
                path: path
            });
        });
    });

    const endpointsDeclarations: Map<string, Map<string, string>> = new Map();

    registeredEndpoints.forEach(endpoint => {
        endpoint.methods.forEach(method => {
            for (const foundEndpoint of foundEndpoints) {
                if(endpoint.path.endsWith(foundEndpoint.path) && foundEndpoint.method.toUpperCase() === method){
                    let declaration = endpointsDeclarations.get(method);
                    if(!declaration)
                        declaration = new Map();
                    declaration.set(endpoint.path, foundEndpoint.types);
                    endpointsDeclarations.set(method, declaration);
                    break;
                }
            }
        });
    });

    let declarations = "", dataTypes = "";

    const dataTypesFiles = sync(path.resolve(config.src, "**", "*.d.ts"), {ignore: [path.resolve(config.src, "**", "node_modules", "**")]});
    dataTypesFiles.forEach(dataType => {
        dataTypes += fs.readFileSync(dataType, {encoding: "utf-8"}) + "\n\n";
    });

    declarations += dataTypes;

    declarations += "declare global {\n";
    for(const [method, endpoints] of endpointsDeclarations){
        declarations += "type ENDPOINTS_" + method + " = { \n";
        for(let [path, types] of endpoints){
            let pathComponents = path.split("/");

            if(pathComponents.some(pathComponent => pathComponent.startsWith(":"))){
                pathComponents = pathComponents.map(pathComponent => {
                    if(!pathComponent.startsWith(":"))
                        return pathComponent;

                    return "${string}";
                });
                path = "[" + randStr(5) + ": `" + pathComponents.join("/") + "`]";
            }else{
                path = "\"" + path + "\""
            }


            declarations += path + ":" + types + "\n";
        }
        declarations += "}\n\n"
    }
    declarations += "}";

    if(!dataTypes){
        declarations += "\n\nexport {}";
    }

    const typesDir = path.resolve(process.cwd(), "node_modules", "@types", "fullstacked");
    if(!fs.existsSync(typesDir))
        fs.mkdirSync(typesDir, {recursive: true});

    fs.writeFileSync(path.resolve(typesDir, "index.d.ts"), declarations);
}
