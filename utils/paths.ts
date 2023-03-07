import {fileURLToPath} from "url";

export const fullstackedServer          = fileURLToPath(new URL("../server/index.ts", import.meta.url));
export const fullstackedClient          = fileURLToPath(new URL("../client/index.ts", import.meta.url));
export const fullstackedClientWatcher   = fileURLToPath(new URL("../client/watcher.ts", import.meta.url));
