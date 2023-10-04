import fs from "fs";
import {resolve, basename, join} from "path";
import ignore, {Ignore} from "ignore";

// key => last modified ms
type Snapshot = { [key: string]: number };

export async function createSnapshot(baseDir: string, keys: string[]) {
    const snapshot: Snapshot  = {};

    await Promise.all(keys.map(key => new Promise<void>(res => {
        fs.promises.lstat(resolve(baseDir, key)).then(({mtimeMs}) => {
            snapshot[key] = mtimeMs;
            res();
        })
    })));

    return snapshot;
}

export function getSnapshotDiffs(snapshotA: Snapshot, snapshotB: Snapshot){
    return Object.keys(snapshotA).filter(key => snapshotA[key] !== snapshotB[key]);
}

export function walkAndIgnore(baseDirectory: string, directory?: string, ignoreAcc?: Ignore){
    directory = directory || ".";

    let items = fs.readdirSync(join(baseDirectory, directory)).map(item => join(directory, item));
    const itemsNames = items.map(item => basename(item));

    if(itemsNames.includes(".gitignore")){
        if(!ignoreAcc){
            ignoreAcc = ignore();
        }
        ignoreAcc.add(fs.readFileSync(resolve(baseDirectory, directory, ".gitignore")).toString().split("\n"));
    }

    if(ignoreAcc)
        items = items.filter(item => !ignoreAcc.ignores(item));

    return items.concat(items.filter(item => fs.lstatSync(join(baseDirectory, item)).isDirectory()).map(dir => walkAndIgnore(baseDirectory, dir, ignoreAcc)).flat());
}
