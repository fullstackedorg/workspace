import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const fullstackedServer = resolve(__dirname,"..",  "server", "index.ts");
export const fullstackedClient = resolve(__dirname, "..", "client", "index.ts");
export const fullstackedClientWatcher = resolve(__dirname, "..", "client", "watcher.ts");
