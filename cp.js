import {cpSync} from "fs";
import {dirname} from "path";

const pwaDirectory = new URL(import.meta.url);
pwaDirectory.pathname = dirname(pwaDirectory.pathname) + "/pwa";

const distClientDirectory = new URL(import.meta.url);
distClientDirectory.pathname = dirname(pwaDirectory.pathname) + "/dist/client/pwa";

cpSync(pwaDirectory, distClientDirectory, {recursive: true});
