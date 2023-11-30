import {fsInit} from "./fs-init";
import {IncomingMessage} from "http";
import {homedir} from "os";
import {Sync} from "./index";
import {fsCloudClient} from "./fs-cloud-client";
import {RsyncHTTP2Client} from "@fullstacked/sync/http2/client";

const getLocalBaseDir = () => Sync.config?.directory || homedir();

export const fsCloud = {
    ...fsInit(fsCloudClient.post.bind(fsCloudClient), () => "./"),

    // pull files from cloud
    async sync(key: string, save = true) {
        // cannot push/pull at same time
        if(Sync.status?.syncing && Sync.status.syncing[key]) return;

        // make sure key exists on remote
        try {
            await fsCloudClient.post().access(key)
        } catch (e) {
            Sync.removeKey(key);
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
        if(unresolvedConflicts.length) return;

        // should be all resolved then
        const resolvedConflicts = conflicts 
            ? Object.keys(conflicts)
            : undefined;

        const syncClient = new RsyncHTTP2Client(Sync.endpoint);
        syncClient.baseDir = getLocalBaseDir();
        Sync.addSyncingKey(key, "pull");
        const response = await syncClient.pull(key, {
            exclude: resolvedConflicts,
            progress(info){
                Sync.updateSyncingKeyProgress(key, info)
            }
        });
        Sync.removeSyncingKey(key);
        if(save)
            Sync.addKey(key);

        if(conflicts)
            Sync.removeResolvedConflictKey(key);

        if(response.status === "conflicts")
            Sync.addConflicts(key, response.items);

        if(response.status === "error")
            Sync.sendError(response.message);
    },

    async authenticate(this: {req: IncomingMessage}, data: any){
        let token;
        try{
            token = await (await fetch(data.url, {
                method: "POST",
                headers: {
                    "user-agent": this.req.headers["user-agent"]
                },
                body: JSON.stringify(data)
            })).text()
        }catch (e) { console.log(e) }

        fsCloudClient.headers.authorization = token;
        Sync.setAuthorization(token);
    },

    setDirectory(directory: string) {
        Sync.setDirectory(directory);
    },

    setEndpoint(endpoint: string){
        Sync.endpoint = endpoint;
        fsCloudClient.origin = endpoint;
    },
}
