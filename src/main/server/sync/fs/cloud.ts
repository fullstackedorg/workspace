import { fsInit } from "./init";
import { IncomingMessage } from "http";
import { homedir } from "os";
import { Sync } from "../sync";
import { SyncClient } from "../client";

export const getLocalBaseDir = () => Sync.config?.directory || homedir();

export const fsCloud = {
    ...fsInit(SyncClient.fs.post.bind(SyncClient.fs), () => "./"),

    // pull files from cloud
    async sync(key: string, options: { save: boolean, progress: boolean } = { save: true, progress: true }) {
        // cannot push/pull at same time
        if (Sync.status?.syncing && Sync.status.syncing[key]) return;

        // just to be safe, reset those values
        SyncClient.rsync.baseDir = getLocalBaseDir();
        if (Sync.config.authorization){
            SyncClient.rsync.headers.authorization = Sync.config.authorization;
            SyncClient.fs.headers.authorization = Sync.config.authorization;
        }

        // make sure key exists on remote
        try {
            await SyncClient.fs.post().access(key)
        } catch (e) {
            console.log(e);
            Sync.sendError(`Key [${key}] does not exists on cloud storage.`);
            return;
        }

        const conflicts = Sync.status.conflicts && Sync.status.conflicts[key]
            ? Sync.status.conflicts[key]
            : null;

        const unresolvedConflicts = conflicts
            ? Object.keys(conflicts).filter(key => !conflicts[key])
            : [];

        // dont pull with unresolved conflicts
        if (unresolvedConflicts.length) return;

        // should be all resolved then
        const resolvedConflicts = conflicts
            ? Object.keys(conflicts)
            : undefined;

        Sync.addSyncingKey(key, "pull", !options.progress);
        const response = await SyncClient.rsync.pull(key, {
            exclude: resolvedConflicts,
            progress(info) {
                if(options.progress)
                    Sync.updateSyncingKeyProgress(key, info)
            }
        });
        Sync.removeSyncingKey(key);
        if (options.save)
            Sync.addKey(key);

        if (conflicts)
            Sync.removeResolvedConflictKey(key);

        if (response.status === "conflicts")
            Sync.addConflicts(key, response.items);

        if (response.status === "error")
            Sync.sendError(response.message);
    },

    async authenticate(this: { req: IncomingMessage }, data: any) {
        // host.docker.internal represents your host machine localhost
        if (process.env.DOCKER_RUNTIME) {
            data.url = data.url.replace(/(localhost|0.0.0.0)/, "host.docker.internal")
        }

        const response = await fetch(data.url, {
            method: "POST",
            headers: {
                "user-agent": this.req.headers["user-agent"]
            },
            body: JSON.stringify(data)
        });

        const token = await response.text();

        Sync.setAuthorization(token);
    },

    setDirectory(directory: string) {
        Sync.setDirectory(directory);
    },

    setEndpoint(endpoint: string) {
        // host.docker.internal represents your host machine localhost
        if (process.env.DOCKER_RUNTIME) {
            endpoint = endpoint.replace(/(localhost|0.0.0.0)/, "host.docker.internal")
        }

        SyncClient.fs.origin = endpoint;
        SyncClient.rsync.endpoint = endpoint;
    },
}
