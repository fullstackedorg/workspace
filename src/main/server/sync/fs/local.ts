// import fs from "fs";
// import { fsInit } from "./init";
// import { homedir } from "os";
// import { Sync } from "../sync";
// import path, { resolve } from "path";
// import { SyncClient } from "../client";
// import { normalizePath } from "../utils";
// import { scan } from "@fullstacked/sync/utils"

// const getBaseDir = () => Sync.config?.directory || homedir();

// export const fsLocal = {
//     ...fsInit(fs.promises, getBaseDir),

//     resolveConflict(baseKey: string, key: string, contents: string) {
//         const filePath = resolve(getBaseDir(), key);
//         fs.writeFileSync(filePath, contents);
//         Sync.resolveConflict(baseKey, key);
//     },

//     // push files to cloud
//     async sync(key: string, options: { save: boolean, progress: boolean } = { save: true, progress: true }) {
//         // cannot push/pull at same time
//         if (Sync.status?.syncing && Sync.status.syncing[key]) return;

//         // dont push with conflicts
//         if (Sync.status.conflicts && Sync.status.conflicts[key]) return;

//         // make sure key exists
//         if (!fs.existsSync(resolve(getBaseDir(), key))) {
//             Sync.sendError(`Trying to push [${key}], but does not exists`);
//             return;
//         }

//         // just to be safe, reset those values
//         SyncClient.rsync.baseDir = getBaseDir();
//         if (Sync.config.authorization) {
//             SyncClient.rsync.headers.authorization = Sync.config.authorization;
//             SyncClient.fs.headers.authorization = Sync.config.authorization;
//         }

//         // sync
//         Sync.addSyncingKey(key, "push", !options.progress);
//         const response = await SyncClient.rsync.push(key, {
//             filters: [".gitignore"],
//             progress(info) {
//                 if (options.progress)
//                     Sync.updateSyncingKeyProgress(key, info)
//             }
//         });
//         Sync.removeSyncingKey(key);

//         if (options.save)
//             Sync.addKey(key);

//         if (response.status === "error"){
//             Sync.sendError(response.message);
//             return;
//         }
//         else if (response.status === "none")
//             return;

//         // don't look for apps if syncing file
//         if(fs.statSync(path.resolve(getBaseDir(), key)).isFile())
//             return;
       
//         // sync app files
//         const packageJSONs = findAllPackageJSON(getBaseDir(), key);

//         await Promise.all(packageJSONs.map(syncApp));
//     }
// }

// function findAllPackageJSON(baseDir: string, dir: string) {
//     return scan(baseDir, dir, [".gitignore"])
//         .filter(([itemPath]) => itemPath.endsWith("/package.json"))
//         .map(([packageJSONPath]) => packageJSONPath);
// }

// async function syncApp (packageJSON: string) {
//     const json = JSON.parse(fs.readFileSync(path.resolve(SyncClient.rsync.baseDir, packageJSON)).toString());
//     if(!json.files)
//         return;

//     const dir = path.dirname(packageJSON);
//     const title = json.title || json.name;
    
//     Sync.addSyncingKey(title, "push");
//     const responses = await Promise.all(json.files.map(item => SyncClient.rsync.push(normalizePath(path.join(dir, item)), {
//         force: true,
//         progress(info) {
//             Sync.updateSyncingKeyProgress(title, info);
//         }
//     })));
//     Sync.removeSyncingKey(title);

//     responses.forEach(response => {
//         if (response.status === "error")
//             Sync.sendError(response.message)
//     })
// }