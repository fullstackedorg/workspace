import { fileURLToPath } from "url";
import { dirname } from "path";

global.__filename = fileURLToPath(import.meta.url);
global.__dirname = dirname(global.__filename);
