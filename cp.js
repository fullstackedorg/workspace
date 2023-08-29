import {cpSync} from "fs";
import {dirname} from "path";

const pwaDirectory = new URL(import.meta.url);
pwaDirectory.pathname = dirname(pwaDirectory.pathname) + "/pwa";

const distClientDirectory = new URL(import.meta.url);
distClientDirectory.pathname = dirname(pwaDirectory.pathname) + "/dist/client/pwa";

cpSync(pwaDirectory, distClientDirectory, {recursive: true});

const binDirectory = new URL(import.meta.url);
binDirectory.pathname = dirname(binDirectory.pathname) + "/server/bin";

const distServerDirectory = new URL(import.meta.url);
distServerDirectory.pathname = dirname(pwaDirectory.pathname) + "/dist/server/bin";

cpSync(binDirectory, distServerDirectory, {recursive: true});
