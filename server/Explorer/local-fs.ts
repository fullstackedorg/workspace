import fs from "fs";
import {initFS} from "./init-fs";

export const LocalFS = initFS(fs.promises);
