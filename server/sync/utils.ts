import fs from "fs";
import {resolve, basename, join} from "path";
import ignore, {Ignore} from "ignore";
import {Sync} from "./index";

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
    const keysA = Object.keys(snapshotA);
    const keysB = Object.keys(snapshotB);

    const missingInA = keysB.filter(keyFromB => !keysA.includes(keyFromB));
    const missingInB = keysA.filter(keyFromA => !keysB.includes(keyFromA));

    const keysInBoth = Array.from(new Set([
        ...keysA,
        ...keysB
    ])).filter(key => !missingInA.includes(key) && !missingInB.includes(key));

    const diffs = keysInBoth.filter(key => snapshotA[key] !== snapshotB[key]);

    return {
        missingInA,
        missingInB,
        diffs
    }
}

export function walkAndIgnore(baseDirectory: string, baseKey: string, directory?: string, ignoreAcc?: Ignore){
    directory = directory || ".";

    let items = fs.readdirSync(join(baseDirectory, baseKey, directory)).map(item => join(directory, item));
    const itemsNames = items.map(item => basename(item));

    if(!ignoreAcc){
        ignoreAcc = ignore();
        ignoreAcc.add(Sync.globalIgnore);
    }

    if(itemsNames.includes(".gitignore")){
        ignoreAcc.add(fs.readFileSync(resolve(baseDirectory, baseKey, directory, ".gitignore")).toString().split("\n"));
    }

    if(ignoreAcc)
        items = items.filter(item => !ignoreAcc.ignores(join(baseKey, item)));

    return items.concat(items.filter(item => fs.lstatSync(join(baseDirectory, baseKey, item)).isDirectory()).map(dir => walkAndIgnore(baseDirectory, baseKey, dir, ignoreAcc)).flat());
}
