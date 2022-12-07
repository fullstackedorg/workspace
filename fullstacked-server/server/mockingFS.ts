//@ts-nocheck
import fs from "fs";
import {resolve} from "path"
import {localAppDir} from "./index";
import child_process from "child_process";

const tree = [
    'foo',
    'bar',
    'baz',
    'fullstacked-server'
];


if(process.argv.includes("--development")){
    fs.readdirSync = function(path){
        switch (path) {
            case localAppDir:
                return tree;
            case resolve(localAppDir, tree[0]):
            case resolve(localAppDir, tree[1]):
            case resolve(localAppDir, tree[2]):
                return [
                    "nginx.conf",
                    "docker-compose.yml",
                    "0.0.1",
                    "0.0.2",
                    "0.0.3"
                ]
            default:
                return []
        }
    };

    const originalStatSync = fs.statSync;
    fs.statSync = function (path) {
        if(!fs.existsSync(path)) return originalStatSync(__dirname);
        return originalStatSync(path)
    }

    const originalExistsSync = fs.existsSync;
    fs.existsSync = function (path){
        if(!path.endsWith("docker-compose.yml")) return originalExistsSync(path);
        return true;
    }

    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = function (path, options){
        if(!path.endsWith("nginx.conf")) return originalReadFileSync(path, options);
        const appID = path.split("/").at(-2);
        return `server {
    # Listen Ports
    listen              80;

    # Server Name
    server_name         ${appID}.test.com;

    # Certificates

    location / {
        # Internal Proxy Pass
        proxy_pass http://0.0.0.0:800${tree.indexOf(appID) + 1};

        # Nginx Extra Configurations
    }
}`;
    }

    const originalExecSync = child_process.execSync;
    child_process.execSync = function (cmd){
        if(cmd.endsWith("ps -q node")) return "xyz";
        if(!cmd.includes("inspect")) return originalExecSync(cmd);
        return `[
            {
                "Mounts": [
                    {
                        "Type": "bind",
                        "Source": "/Server/App/Dir/AppID/0.0.0",
                        "Destination": "/app",
                        "Mode": "rw",
                        "RW": true,
                        "Propagation": "rprivate"
                    },
                    {
                        "Type": "bind",
                        "Source": "/var/run/docker.sock",
                        "Destination": "/var/run/docker.sock",
                        "Mode": "rw",
                        "RW": true,
                        "Propagation": "rprivate"
                    },
                    {
                        "Type": "volume",
                        "Name": "fullstacked_fullstacked-server-data",
                        "Source": "/var/lib/docker/volumes/fullstacked_fullstacked-server-data/_data",
                        "Destination": "/data",
                        "Driver": "local",
                        "Mode": "z",
                        "RW": true,
                        "Propagation": ""
                    }
                ]

            }
        ]`
    }

    const originalExec = child_process.exec;
    child_process.exec = function(cmd){
        if(!cmd.includes("certbot")) return originalExec(cmd);

        return originalExec("cat index.js");
    }
}
